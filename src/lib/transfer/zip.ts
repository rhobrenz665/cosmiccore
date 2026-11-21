const crcTable = Uint32Array.from({ length: 256 }, (_, byte) => {
  let value = byte;
  for (let bit = 0; bit < 8; bit++) {
    value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  }
  return value;
});

function crc32(bytes: Uint8Array) {
  let value = 0xffffffff;
  for (const byte of bytes) value = (value >>> 8) ^ crcTable[(value ^ byte) & 0xff];
  return (value ^ 0xffffffff) >>> 0;
}

type Entry = { filename: string; body: string };

// ZIP32 stored entries. BUILD-08 bounds sizes and entry count well below ZIP32 limits.
export function prepareMarkdownZip(entries: Entry[]) {
  let offset = 0;
  const directory: Buffer[] = [];
  const payloads = entries.map(({ filename, body }) => {
    const name = Buffer.from(filename, "ascii");
    const bytes = Buffer.from(body, "utf8");
    const checksum = crc32(bytes);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x21, 12); // ZIP epoch 1980-01-01
    header.writeUInt32LE(checksum, 14);
    header.writeUInt32LE(bytes.length, 18);
    header.writeUInt32LE(bytes.length, 22);
    header.writeUInt16LE(name.length, 26);

    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(20, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(0x21, 14);
    record.writeUInt32LE(checksum, 16);
    record.writeUInt32LE(bytes.length, 20);
    record.writeUInt32LE(bytes.length, 24);
    record.writeUInt16LE(name.length, 28);
    record.writeUInt32LE(offset, 42);
    directory.push(record, name);
    offset += header.length + name.length + bytes.length;
    return [header, name, bytes];
  });
  const directorySize = directory.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directorySize, 12);
  end.writeUInt32LE(offset, 16);
  return { chunks: [...payloads.flat(), ...directory, end], size: offset + directorySize + end.length };
}

export function streamZip(chunks: Uint8Array[], signal: AbortSignal, deadline: number, onError: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  let index = 0;
  function finish() {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
    chunks.length = 0;
  }
  let abort: () => void;
  return new ReadableStream<Uint8Array>({
    start(controller) {
      abort = () => {
        finish();
        onError();
        controller.error(new Error("Export interrupted."));
      };
      if (signal.aborted || Date.now() >= deadline) return abort();
      signal.addEventListener("abort", abort, { once: true });
      timer = setTimeout(abort, deadline - Date.now());
    },
    pull(controller) {
      if (index < chunks.length) controller.enqueue(chunks[index++]);
      if (index === chunks.length) {
        finish();
        controller.close();
      }
    },
    cancel() {
      finish();
      onError();
    },
  });
}
