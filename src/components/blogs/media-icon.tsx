/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy icon adapter migration.
import { FaImages, FaImage, FaTimes, FaBookOpen, FaCloudUploadAlt, FaSpinner, FaSearch, FaCalendar, FaCheck, FaCheckCircle, FaFilePdf, FaFilm } from 'react-icons/fa';
const icons = { 'fa-images': FaImages, 'fa-image': FaImage, 'fa-times': FaTimes, 'fa-book-open': FaBookOpen, 'fa-cloud-upload-alt': FaCloudUploadAlt, 'fa-spinner': FaSpinner, 'fa-search': FaSearch, 'fa-calendar': FaCalendar, 'fa-check': FaCheck, 'fa-check-circle': FaCheckCircle, 'fa-file-pdf': FaFilePdf, 'fa-film': FaFilm };
export default function MediaIcon({ className = '' }) {
  const tokens = className.split(/\s+/);
  const Icon = icons[tokens.find(token => icons[token])] || FaImage;
  return <Icon aria-hidden="true" className={className.replace('fa-spin', 'animate-spin')} />;
}
