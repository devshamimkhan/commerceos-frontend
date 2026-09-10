/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy icon adapter migration.
import { FaFilePdf, FaFileCsv, FaCloudUploadAlt, FaSpinner, FaFolderOpen, FaUndoAlt, FaTh, FaList, FaTrash, FaEye, FaChevronLeft, FaChevronRight, FaTimes, FaCheck, FaCopy, FaPen, FaSyncAlt, FaExternalLinkAlt } from 'react-icons/fa';
const icons = { 'fa-file-pdf': FaFilePdf, 'fa-file-csv': FaFileCsv, 'fa-cloud-upload-alt': FaCloudUploadAlt, 'fa-spinner': FaSpinner, 'fa-folder-open': FaFolderOpen, 'fa-undo-alt': FaUndoAlt, 'fa-th': FaTh, 'fa-list': FaList, 'fa-trash': FaTrash, 'fa-eye': FaEye, 'fa-chevron-left': FaChevronLeft, 'fa-chevron-right': FaChevronRight, 'fa-times': FaTimes, 'fa-check': FaCheck, 'fa-copy': FaCopy, 'fa-pen': FaPen, 'fa-sync-alt': FaSyncAlt, 'fa-external-link-alt': FaExternalLinkAlt };
export default function LibraryIcon({ className = '' }) {
 const Icon = icons[className.split(/\s+/).find(name => icons[name])] || FaFolderOpen;
 return <Icon aria-hidden="true" className={className.replace('fa-spin', 'animate-spin')} />;
}
