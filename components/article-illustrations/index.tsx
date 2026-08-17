import type { ComponentType } from 'react'

import { CompressPdfPrivacyIllustration } from './compress-pdf-privacy'
import { AvifWebpJpegIllustration } from './avif-webp-jpeg-comparison'
import { BrowserConversionIllustration } from './browser-conversion-explainer'
import { VsAdobeAcrobatIllustration } from './vs-adobe-acrobat'
import { VsIlovepdfIllustration } from './vs-ilovepdf'
import { PdfWatermarkIllustration } from './pdf-watermark'
import { PasswordProtectIllustration } from './password-protect-pdf'
import { WordToPdfIllustration } from './word-to-pdf'
import { ExamPhotoRequirementsIllustration } from './exam-photo-requirements'
import { ExamPhotoRejectedIllustration } from './exam-photo-rejected'
import { ExifDataIllustration } from './exif-data'
import { WhatIsHeicIllustration } from './what-is-heic'
import { LosslessVsLossyIllustration } from './lossless-vs-lossy'
import { CropPhotoExamIllustration } from './crop-photo-exam'
import { HeicToJpgWindowsIllustration } from './heic-to-jpg-windows'
import { CompressImageQualityIllustration } from './compress-image-quality'
import { BatchConvertIllustration } from './batch-convert-images'
import { WebpQualityIllustration } from './webp-quality-slider'
import { AvifBrowserSupportIllustration } from './avif-browser-support'
import { MergePdfIllustration } from './merge-pdf'
import { AltTextIllustration } from './alt-text-guide'
import { AltTextCsvIllustration } from './alt-text-csv-import'
import { CompressVideoPrivacyIllustration } from './compress-video-privacy'
import { H264VsH265Illustration } from './h264-vs-h265'
import { BatchCompressVideosIllustration } from './batch-compress-videos'

export const articleIllustrations: Record<string, ComponentType> = {
  'compress-pdf-without-uploading-privacy-guide': CompressPdfPrivacyIllustration,
  'avif-vs-webp-vs-jpeg-2026': AvifWebpJpegIllustration,
  'how-browser-based-file-conversion-works': BrowserConversionIllustration,
  'convertyard-vs-adobe-acrobat-pro': VsAdobeAcrobatIllustration,
  'convertyard-vs-ilovepdf': VsIlovepdfIllustration,
  'pdf-watermarking-guide': PdfWatermarkIllustration,
  'password-protect-pdf-when-encryption-isnt-enough': PasswordProtectIllustration,
  'word-to-pdf-and-back-what-survives': WordToPdfIllustration,
  'exam-photo-requirements-compared-2026': ExamPhotoRequirementsIllustration,
  'why-exam-photo-keeps-getting-rejected': ExamPhotoRejectedIllustration,
  'exif-data-whats-hiding-in-your-photo': ExifDataIllustration,
  'what-is-heic': WhatIsHeicIllustration,
  'lossless-vs-lossy': LosslessVsLossyIllustration,
  'cropping-photos-for-id-and-exam-requirements': CropPhotoExamIllustration,
  'heic-to-jpg-on-windows': HeicToJpgWindowsIllustration,
  'compress-images-without-losing-quality': CompressImageQualityIllustration,
  'batch-convert-images': BatchConvertIllustration,
  'best-webp-quality': WebpQualityIllustration,
  'avif-browser-support': AvifBrowserSupportIllustration,
  'merge-pdf-without-uploading': MergePdfIllustration,
  'alt-text-guide': AltTextIllustration,
  'import-alt-text-csv-to-cms': AltTextCsvIllustration,
  'compress-video-without-uploading': CompressVideoPrivacyIllustration,
  'h264-vs-h265-video-compression': H264VsH265Illustration,
  'batch-compress-videos': BatchCompressVideosIllustration,
}
