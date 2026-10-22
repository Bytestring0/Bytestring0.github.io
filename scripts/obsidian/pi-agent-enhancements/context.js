export async function buildExplicitContext(builder, parsedPrompt, selection = '', options) {
  const wantsActiveNote = Boolean(options?.activeNotePath) || parsedPrompt.references.some(reference => reference.type === 'command' && ['current', 'links', 'backlinks'].includes(reference.value));
  const activeNote = wantsActiveNote ? await builder.resolveActiveNote(selection, options) : undefined;
  const linkedNeighborhood = activeNote ? await builder.graph.getLinkedNeighborhood(activeNote.path, 1) : [];
  const attachments = await builder.resolveAttachments(parsedPrompt.references, activeNote);
  return builder.enrichPromptContext({ activeNote, annotations: [], linkedNeighborhood, searchResults: [], attachments }, options);
}

export function selectionAttachment({ text, file, from, to }, existing = []) {
  if (!text?.trim() || !file?.path) throw new Error('请先在笔记中选中要引用的文字');
  if (existing.some(item => item.source === 'vault' && item.path === file.path && item.content === text)) return undefined;
  const bytes = new TextEncoder().encode(text).length;
  const used = existing.reduce((sum, item) => sum + new TextEncoder().encode(item.content || '').length, 0);
  if (bytes > 64 * 1024 || used + bytes > 192 * 1024) throw new Error('选中文字超过附件大小限制，请缩小选区或移除其他引用');
  const lastLine = to ? to.line - (to.ch === 0 && to.line > from?.line ? 1 : 0) : from?.line;
  const lines = from ? `L${from.line + 1}${lastLine !== from.line ? `–L${lastLine + 1}` : ''}` : '选中片段';
  return { id: crypto.randomUUID(), kind: 'text', fileName: `选中文字 · ${file.name || file.basename + '.md'}（${lines}）`, mimeType: 'text/markdown', content: text, originalSize: bytes, includedBytes: bytes, truncated: false, source: 'vault', path: file.path, selectionReference: true };
}
