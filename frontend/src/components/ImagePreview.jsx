export function ImagePreview({ file }) {
  if (!file) return null;

  const url = URL.createObjectURL(file);

  return (
    <div className="relative group border-4 border-gray-200 rounded-2xl overflow-hidden w-80 h-80 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 shadow-lg hover:shadow-2xl transition-all duration-300">
      <img
        src={url}
        alt="Uploaded preview"
        className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
}
