import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase'

export type PickedAsset = {
  uri: string
  name?: string | null
  mimeType?: string | null
}

function sanitizeFilename(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]/g, '_')
}
function extFromMime(ct?: string | null) {
  if (ct === 'application/pdf') return 'pdf'
  if (ct === 'image/png') return 'png'
  return 'bin'
}
function ensureContentType(asset: PickedAsset) {
  const mime = asset.mimeType?.toLowerCase()
  if (mime === 'application/pdf' || mime === 'image/png') return mime
  if (asset.name?.toLowerCase().endsWith('.pdf')) return 'application/pdf'
  if (asset.name?.toLowerCase().endsWith('.png')) return 'image/png'
  return 'application/octet-stream'
}

export async function uploadTransactionFile(params: {
  userId: string
  transactionId: string
  asset: PickedAsset
}) {
  const { userId, transactionId, asset } = params

  const contentType = ensureContentType(asset)
  const original = asset.name || `file.${extFromMime(contentType)}`
  const safe = sanitizeFilename(original)
  const uniq = `${Date.now()}-${safe}`

  const objectPath = `${userId}/${transactionId}/${uniq}`

  const form = new FormData()
  form.append('file', {
    uri: asset.uri,
    name: safe,
    type: contentType,
  })

  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new Error('Sem sessão para enviar arquivo')

  const endpoint = `${SUPABASE_URL}/storage/v1/object/transaction-files/${objectPath}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
      'x-upsert': 'false',
    } as any,
    body: form,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Upload falhou: ${res.status} ${text}`)
  }

  const { error: dbErr } = await supabase.from('transaction_files').insert({
    transaction_id: transactionId,
    profile_id: userId,
    path: objectPath,
    content_type: contentType,
  })
  if (dbErr) {
    await supabase.storage.from('transaction-files').remove([objectPath])
    throw dbErr
  }

  return { path: objectPath, contentType }
}

export async function deleteTransactionFile(params: {
  transactionId: string
  path: string
}) {
  const { transactionId, path } = params
  await supabase.storage.from('transaction-files').remove([path])
  await supabase
    .from('transaction_files')
    .delete()
    .eq('transaction_id', transactionId)
    .eq('path', path)
}

export async function deleteAllTransactionFiles(transactionId: string) {
  const { data, error } = await supabase
    .from('transaction_files')
    .select('path')
    .eq('transaction_id', transactionId)

  if (error) throw error
  const paths = (data ?? []).map((r) => r.path) as string[]
  if (paths.length === 0) return

  const { error: stErr } = await supabase.storage
    .from('transaction-files')
    .remove(paths)
  if (stErr) throw stErr

  await supabase
    .from('transaction_files')
    .delete()
    .eq('transaction_id', transactionId)
}

export function filenameFromPath(path: string) {
  const parts = path.split('/')
  return parts[parts.length - 1] || path
}

export function iconByContentType(ct: string) {
  return ct === 'application/pdf' ? 'document-text-outline' : 'image-outline'
}
