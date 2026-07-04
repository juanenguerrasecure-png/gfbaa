import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { PhotoUploader } from '../../components/PhotoUploader';
import { Save, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Sparkles } from 'lucide-react';

export function GalleryTab() {
  const { galleryPhotos = [], saveGalleryPhotos } = useStore();
  const [photosList, setPhotosList] = useState([]);
  
  // New photo form state
  const [newPhotoUrl, setNewPhotoUrl] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newStory, setNewStory] = useState('');
  
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Clone to local state so we can edit reorders/captions locally before saving
    setPhotosList(JSON.parse(JSON.stringify(galleryPhotos || [])));
  }, [galleryPhotos]);

  const handleAddPhoto = () => {
    if (!newPhotoUrl) {
      setStatus('Please upload an image first.');
      return;
    }

    const nextOrder = photosList.length > 0 
      ? Math.max(...photosList.map(p => Number(p.order) || 0)) + 1 
      : 1;

    const newPhoto = {
      id: `gal-${Date.now()}`,
      url: newPhotoUrl,
      title: newTitle.trim(),
      caption: newCaption.trim(),
      story: newStory.trim(),
      order: nextOrder
    };

    const updatedList = [...photosList, newPhoto];
    setPhotosList(updatedList);
    
    // Reset form
    setNewPhotoUrl(null);
    setNewTitle('');
    setNewCaption('');
    setNewStory('');
    setStatus('Photo added to list. Press "Save Gallery Changes" below to publish.');
  };

  const handleDeletePhoto = (id) => {
    const updatedList = photosList.filter(p => p.id !== id);
    setPhotosList(updatedList);
    setStatus('Photo removed from list. Press "Save Gallery Changes" to publish.');
  };

  const handleUpdateTitle = (id, value) => {
    const updatedList = photosList.map(p => p.id === id ? { ...p, title: value } : p);
    setPhotosList(updatedList);
  };

  const handleUpdateCaption = (id, value) => {
    const updatedList = photosList.map(p => p.id === id ? { ...p, caption: value } : p);
    setPhotosList(updatedList);
  };

  const handleUpdateStory = (id, value) => {
    const updatedList = photosList.map(p => p.id === id ? { ...p, story: value } : p);
    setPhotosList(updatedList);
  };

  const handleUpdateOrder = (id, value) => {
    const updatedList = photosList.map(p => p.id === id ? { ...p, order: Number(value) || 0 } : p);
    setPhotosList(updatedList);
  };

  const movePhoto = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === photosList.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedList = [...photosList];
    
    // Swap elements
    const temp = updatedList[index];
    updatedList[index] = updatedList[targetIndex];
    updatedList[targetIndex] = temp;

    // Recalculate clean consecutive order fields
    const orderedList = updatedList.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));

    setPhotosList(orderedList);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus('');
    try {
      // Sort list by their order value before saving
      const sortedList = [...photosList].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      const res = await saveGalleryPhotos(sortedList);

      if (res && res.error) {
        setStatus(`Error saving to cloud: ${res.error}`);
      } else {
        setStatus('Gallery curations successfully updated and synchronized.');
      }
    } catch (err) {
      console.error(err);
      setStatus(err.message || 'Failed to save gallery changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="gallery_tab_container">
      {/* Tab Title */}
      <div className="border-b border-stone-200 pb-4">
        <h2 className="font-display text-2xl text-stone-900 font-normal">Gallery Curation</h2>
        <p className="text-sm text-stone-500">
          Publish and manage editorial/lifestyle photographs. These show up in the masonry storefront gallery to display the brand’s creative aesthetic.
        </p>
      </div>

      {status && (
        <div className="text-sm px-4 py-3 rounded border border-[#E5DFD8] bg-white text-stone-700 shadow-sm" id="gallery_tab_status">
          {status}
        </div>
      )}

      {/* Grid: Upload Form & Current Items */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Left Column: Upload Form */}
        <div className="bg-white border border-[#E5DFD8] rounded-lg p-6 space-y-4" id="gallery_upload_form">
          <h3 className="font-display text-lg text-stone-800 font-medium flex items-center gap-2">
            <Sparkles size={16} className="text-[#C9A84C]" />
            Add New Gallery Curation
          </h3>

          <div className="space-y-4">
            <PhotoUploader value={newPhotoUrl} onChange={setNewPhotoUrl} />

            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-stone-500 uppercase block">
                Curation Title *
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Classic Silhouette Duo"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/20 bg-[#FAF8F5]/50"
                id="gallery_input_title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-stone-500 uppercase block">
                Brief Description / Caption *
              </label>
              <textarea
                value={newCaption}
                onChange={e => setNewCaption(e.target.value)}
                placeholder="A high-contrast visual focus on structured leather silhouettes with 24k gold hardware."
                rows={2}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/20 bg-[#FAF8F5]/50"
                id="gallery_input_caption"
              />
              <p className="text-[10px] text-stone-400 font-sans italic">
                A short, elegant line shown directly below the title in the gallery card.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-stone-500 uppercase block">
                Full Story / Whole Description
              </label>
              <textarea
                value={newStory}
                onChange={e => setNewStory(e.target.value)}
                placeholder="Discovered in Tokyo during our late winter diaries. This 1994 masterpiece features gorgeous preservation..."
                rows={4}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/20 bg-[#FAF8F5]/50"
                id="gallery_input_story"
              />
              <p className="text-[10px] text-stone-400 font-sans italic">
                The full narrative or details. Once clicked, users can scroll to read this entire description.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddPhoto}
              className="w-full inline-flex items-center justify-center gap-2 bg-stone-900 text-white py-2.5 rounded text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 transition-colors"
              id="gallery_btn_add"
            >
              <ImageIcon size={14} />
              Add to Gallery List
            </button>
          </div>
        </div>

        {/* Right Columns: Current List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-white border border-[#E5DFD8] p-4 rounded-lg">
            <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
              Curation Items ({photosList.length})
            </span>
            <span className="text-[10px] text-stone-400 font-sans">
              Reorder using arrows, or edit captions directly.
            </span>
          </div>

          {photosList.length === 0 ? (
            <div className="text-center p-12 bg-white border border-dashed border-[#E5DFD8] rounded-lg text-stone-400">
              <ImageIcon size={32} className="mx-auto text-stone-300 mb-2" />
              <p className="text-xs font-medium">No custom curations loaded yet.</p>
              <p className="text-[10px] text-stone-400 mt-1">Sourcing placeholder fallbacks are displayed on the storefront.</p>
            </div>
          ) : (
            <div className="space-y-3" id="gallery_photos_list">
              {photosList.map((photo, index) => (
                <div 
                  key={photo.id}
                  className="bg-white border border-[#E5DFD8] rounded-lg p-4 flex gap-4 items-start"
                  id={`gallery_admin_item_${photo.id}`}
                >
                  {/* Photo Preview */}
                  <img
                    src={photo.url}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded border border-stone-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />

                  {/* Settings Inputs */}
                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5 space-y-1">
                      <label className="text-[9px] uppercase font-mono text-stone-500 block tracking-wider font-semibold">Curation Title</label>
                      <input
                        type="text"
                        value={photo.title || ''}
                        onChange={e => handleUpdateTitle(photo.id, e.target.value)}
                        placeholder="Untitled Curation"
                        className="w-full border border-stone-200 rounded px-2.5 py-1 text-xs text-stone-900 focus:border-[#C9A84C] focus:outline-none bg-stone-50/50"
                      />
                    </div>

                    <div className="md:col-span-5 space-y-1">
                      <label className="text-[9px] uppercase font-mono text-stone-500 block tracking-wider font-semibold">Brief Description (Caption)</label>
                      <input
                        type="text"
                        value={photo.caption || ''}
                        onChange={e => handleUpdateCaption(photo.id, e.target.value)}
                        placeholder="No caption provided"
                        className="w-full border border-stone-200 rounded px-2.5 py-1 text-xs text-stone-900 focus:border-[#C9A84C] focus:outline-none bg-stone-50/50"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[9px] uppercase font-mono text-stone-500 block tracking-wider font-semibold">Sort Order</label>
                      <input
                        type="number"
                        value={photo.order || 0}
                        onChange={e => handleUpdateOrder(photo.id, e.target.value)}
                        className="w-full border border-stone-200 rounded px-2.5 py-1 text-xs text-stone-900 focus:border-[#C9A84C] focus:outline-none bg-stone-50/50 font-mono"
                      />
                    </div>

                    <div className="md:col-span-12 space-y-1">
                      <label className="text-[9px] uppercase font-mono text-stone-500 block tracking-wider font-semibold">Full Story / Description</label>
                      <textarea
                        value={photo.story || ''}
                        onChange={e => handleUpdateStory(photo.id, e.target.value)}
                        placeholder="Tell the full story behind this curation. Scrollable detail once clicked."
                        rows={2}
                        className="w-full border border-stone-200 rounded px-2.5 py-1 text-xs text-stone-900 focus:border-[#C9A84C] focus:outline-none bg-stone-50/50"
                      />
                    </div>
                  </div>

                  {/* Actions (Move, Delete) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => movePhoto(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 hover:bg-stone-100 text-stone-500 hover:text-stone-800 disabled:opacity-30 rounded transition-all"
                      title="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePhoto(index, 'down')}
                      disabled={index === photosList.length - 1}
                      className="p-1.5 hover:bg-stone-100 text-stone-500 hover:text-stone-800 disabled:opacity-30 rounded transition-all"
                      title="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded transition-all ml-1"
                      title="Delete piece"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Save bar */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 disabled:opacity-50 shadow-sm"
              id="gallery_save_btn"
            >
              <Save size={14} />
              {isSaving ? 'Synchronizing...' : 'Save Gallery Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
