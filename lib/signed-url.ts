// Identity and verification documents live in private buckets. What gets stored is a signed link that works for a
// year, not a permanent public address.
const DOC_URL_SECONDS = 60 * 60 * 24 * 365

export async function signedDocUrl(
  client: { storage: { from: (bucket: string) => { createSignedUrl: (path: string, seconds: number) => Promise<{ data: { signedUrl: string } | null; error: unknown }> } } },
  bucket: string,
  path: string,
): Promise<string> {
  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, DOC_URL_SECONDS)
  if (error || !data?.signedUrl) throw new Error('Could not create a signed link')
  return data.signedUrl
}
