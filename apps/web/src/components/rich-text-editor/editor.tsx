'use client'

import { FileHandler } from '@tiptap/extension-file-handler'
import { TextAlign } from '@tiptap/extension-text-align'
import { Underline } from '@tiptap/extension-underline'
import { UniqueID } from '@tiptap/extension-unique-id'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import clsx from 'clsx'
import { useCallback, useEffect, useRef } from 'react'

import { MediaNode, getFile, removeFile } from '@/components/rich-text-editor/extensions/media-node'
import { readAsDataUrl } from '@/components/rich-text-editor/extensions/upload-media'

import { Toolbar } from './toolbar'

interface RichTextEditorProps {
  className?: string
  initialContent?: string
  onUpdate?: (html: string) => void
}

export function RichTextEditor({ className, initialContent, onUpdate }: RichTextEditorProps) {
  const processingIds = useRef(new Set<string>())
  const editorRef = useRef<ReturnType<typeof useEditor>>(null)

  const updateMediaNode = useCallback((nodeId: string, attrs: Record<string, unknown>) => {
    const e = editorRef.current
    if (!e) return
    const { doc, tr } = e.state
    let found = false

    doc.descendants((node, pos) => {
      if (found) return false
      if (node.type.name === 'media' && node.attrs.id === nodeId) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs })
        found = true
        return false
      }
    })

    if (found) {
      e.view.dispatch(tr)
    }
  }, [])

  const processImage = useCallback(
    (nodeId: string, file: File) => {
      if (processingIds.current.has(nodeId)) return
      processingIds.current.add(nodeId)

      readAsDataUrl(file, (progress) => {
        updateMediaNode(nodeId, { progress })
      })
        .then((dataUrl) => {
          updateMediaNode(nodeId, {
            src: dataUrl,
            file: undefined,
            uploadStatus: null,
            progress: 100,
          })
          removeFile(nodeId)
        })
        .catch(() => {
          updateMediaNode(nodeId, { uploadStatus: 'failed' })
        })
        .finally(() => {
          processingIds.current.delete(nodeId)
        })
    },
    [updateMediaNode],
  )

  const processImageRef = useRef(processImage)
  processImageRef.current = processImage

  const convertWhiteTextToBlack = useCallback((html: string): string => {
    return html
      .replace(/color:\s*#ffffff/gi, 'color: #000000')
      .replace(/color:\s*#fff\b/gi, 'color: #000')
      .replace(/color:\s*white\b/gi, 'color: black')
      .replace(/color:\s*rgb\s*\(\s*255\s*,\s*255\s*,\s*255\s*\)/gi, 'color: rgb(0, 0, 0)')
      .replace(/color:\s*rgba\s*\(\s*255\s*,\s*255\s*,\s*255\s*,\s*[^)]+\)/gi, 'color: rgba(0, 0, 0, 1)')
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      UniqueID.configure({ types: ['media'] }),
      FileHandler.configure({
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        onDrop: (currentEditor, files) => {
          for (const file of files) {
            currentEditor.chain().focus().setMedia({ file }).run()
          }
        },
        onPaste: (currentEditor, files) => {
          for (const file of files) {
            currentEditor.chain().focus().setMedia({ file }).run()
          }
        },
      }),
      MediaNode.configure({
        onRetryUpload: (id: string, file: File) => {
          processImageRef.current(id, file)
        },
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML()
      const normalizedHtml = convertWhiteTextToBlack(html)
      onUpdate?.(normalizedHtml)
    },
  })

  editorRef.current = editor

  useEffect(() => {
    if (!editor) return

    const handleTransaction = () => {
      editor.state.doc.descendants((node) => {
        if (
          node.type.name === 'media' &&
          node.attrs.uploadStatus === 'uploading' &&
          node.attrs.id &&
          !processingIds.current.has(node.attrs.id as string)
        ) {
          const file = (node.attrs.file as File) ?? getFile(node.attrs.id as string)
          if (file) {
            processImage(node.attrs.id as string, file)
          }
        }
      })
    }

    editor.on('transaction', handleTransaction)
    return () => {
      editor.off('transaction', handleTransaction)
    }
  }, [editor, processImage])

  return (
    <div className={clsx('overflow-hidden rounded-lg border border-border', className)}>
      <Toolbar editor={editor} />
      <EditorContent
        className="prose prose-sm max-w-none px-4 py-3 focus-within:outline-none [&_.tiptap]:min-h-48 [&_.tiptap]:outline-none"
        editor={editor}
      />
    </div>
  )
}
