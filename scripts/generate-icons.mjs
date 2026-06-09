import fs from 'fs'
import path from 'path'
import { createWriteStream } from 'fs'
import { deflateSync } from 'zlib'

// CRC32 lookup table
const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  }
  crcTable[i] = c
}

function calculateCRC(buffer) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buffer[i]) & 0xFF]
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function createChunk(type, data) {
  const length = new Uint32Array([data.length])
  const typeBuf = new TextEncoder().encode(type)
  const crcData = new Uint8Array(typeBuf.length + data.length)
  crcData.set(typeBuf)
  crcData.set(data, typeBuf.length)
  const crc = new Uint32Array([calculateCRC(crcData)])
  
  const total = 4 + typeBuf.length + data.length + 4
  const result = new Uint8Array(total)
  let offset = 0
  result.set(new Uint8Array(length.buffer), offset); offset += 4
  result.set(typeBuf, offset); offset += typeBuf.length
  result.set(data, offset); offset += data.length
  result.set(new Uint8Array(crc.buffer), offset)
  return result
}

function generatePNG(width, outputPath) {
  const rowBytes = Math.ceil((width * 3 + 3) / 4) * 4
  
  // PNG signature
  const pngSignature = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  ])
  
  // IHDR
  const ihdrData = new Uint8Array(13)
  const view = new DataView(ihdrData.buffer)
  view.setUint32(0, width, false)  // width (big-endian)
  view.setUint32(4, width, false)  // height
  ihdrData[8] = 8   // bit depth
  ihdrData[9] = 2   // color type RGB
  ihdrData[10] = 0  // compression
  ihdrData[11] = 0  // filter
  ihdrData[12] = 0  // interlace
  
  const ihdr = createChunk('IHDR', ihdrData)
  
  // IDAT - solid indigo color
  const idatRaw = new Uint8Array((1 + rowBytes) * width)
  for (let y = 0; y < width; y++) {
    const rowOffset = y * (1 + rowBytes)
    idatRaw[rowOffset] = 0  // filter byte
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 3
      idatRaw[px] = 0x63     // R
      idatRaw[px + 1] = 0x66 // G
      idatRaw[px + 2] = 0xf1 // B
    }
  }
  
  const compressed = deflateSync(Buffer.from(idatRaw))
  const idat = createChunk('IDAT', compressed)
  
  // IEND
  const iend = createChunk('IEND', new Uint8Array(0))
  
  // Combine
  const totalSize = pngSignature.length + ihdr.length + idat.length + iend.length
  const result = new Uint8Array(totalSize)
  let off = 0
  result.set(pngSignature, off); off += pngSignature.length
  result.set(ihdr, off); off += ihdr.length
  result.set(idat, off); off += idat.length
  result.set(iend, off)
  
  fs.writeFileSync(outputPath, result)
  console.log(`Generated ${outputPath} (${width}x${width})`)
}

const publicDir = path.join('public')

generatePNG(192, path.join(publicDir, 'pwa-192x192.png'))
generatePNG(512, path.join(publicDir, 'pwa-512x512.png'))

console.log('All PWA icons generated!')
