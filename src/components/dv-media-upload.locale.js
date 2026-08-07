/**
 * @module components/dv-media-upload.locale
 * `dv-media-upload`'s own locale bundle (ADR-0019) — co-located, not centralized. Only
 * translatable copy lives here; `endpoint`/`accept`/`max-size`/`multiple`/`auto`/`name` are
 * configuration, per `docs/guides/i18n.md` §1.
 */
export default {
  en: {
    label: 'Drop files here or browse',
    uploadLabel: 'Upload',
    removeLabel: 'Remove',
    abortLabel: 'Abort',
    invalidType: 'This file type is not allowed.',
    tooLarge: 'File exceeds the {max} KB limit.',
  },
  tr: {
    label: 'Dosyaları buraya bırakın veya göz atın',
    uploadLabel: 'Yükle',
    removeLabel: 'Kaldır',
    abortLabel: 'İptal',
    invalidType: 'Bu dosya türüne izin verilmiyor.',
    tooLarge: 'Dosya {max} KB sınırını aşıyor.',
  },
};
