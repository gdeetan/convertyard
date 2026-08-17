export function fileMatchesAccept(
  file: File,
  accepts: string[],
  acceptsExt: string[]
): boolean {
  if (accepts.length === 0 || accepts.includes('*/*')) return true
  if (file.type && accepts.includes(file.type)) return true
  const ext = file.name.includes('.')
    ? `.${file.name.split('.').pop()!.toLowerCase()}`
    : ''
  return ext !== '' && acceptsExt.some((e) => e.toLowerCase() === ext)
}

function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = []
    const pull = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(all)
          return
        }
        all.push(...batch)
        pull()
      }, reject)
    }
    pull()
  })
}

function fileFromEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject))
}

async function collectFromEntry(entry: FileSystemEntry, out: File[]): Promise<void> {
  if (entry.isFile) {
    out.push(await fileFromEntry(entry as FileSystemFileEntry))
    return
  }
  if (entry.isDirectory) {
    const children = await readAllEntries((entry as FileSystemDirectoryEntry).createReader())
    for (const child of children) {
      await collectFromEntry(child, out)
    }
  }
}

/** Flatten dropped files and folders. Falls back to dataTransfer.files. */
export async function filesFromDataTransfer(dt: DataTransfer): Promise<File[]> {
  const items = Array.from(dt.items ?? [])
  const entries = items
    .map((item) => (item.kind === 'file' ? item.webkitGetAsEntry?.() : null))
    .filter((e): e is FileSystemEntry => e != null)

  if (entries.some((e) => e.isDirectory)) {
    const files: File[] = []
    for (const entry of entries) {
      await collectFromEntry(entry, files)
    }
    return files
  }

  return Array.from(dt.files)
}
