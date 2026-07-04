import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { PhotoUploader } from '../../components/PhotoUploader';
import { Save, Trash2, BookOpen, ToggleLeft, ToggleRight, Sparkles, PlusCircle } from 'lucide-react';

export function PastCollectionsTab() {
  const { pastCollections = [], savePastCollections } = useStore();
  const [piecesList, setPiecesList] = useState([]);

  // New past piece form state
  const [newBrand, setNewBrand] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newPhotos, setNewPhotos] = useState([]);
  const [newDateAdded, setNewDateAdded] = useState('');
  const [newSold, setNewSold] = useState(true);

  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Clone to local state so we can edit/delete locally before saving
    setPiecesList(JSON.parse(JSON.stringify(pastCollections || [])));
  }, [pastCollections]);

  const handleAddPiece = () => {
    if (!newBrand.trim()) {
      setStatus('Please provide a Brand label.');
      return;
    }
    if (newPhotos.length === 0) {
      setStatus('Please upload at least one image for this archival piece.');
      return;
    }

    const newPiece = {
      id: `past-${Date.now()}`,
      brand: newBrand.trim(),
      caption: newCaption.trim() || 'Archival vintage luxury curation.',
      photos: newPhotos,
      dateAdded: newDateAdded.trim() || new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date()),
      sold: newSold
    };

    const updatedList = [newPiece, ...piecesList]; // Add to top of list
    setPiecesList(updatedList);

    // Reset form
    setNewBrand('');
    setNewCaption('');
    setNewPhotos([]);
    setNewDateAdded('');
    setNewSold(true);
    setStatus('Archival piece added to draft list. Click "Save Archival Portfolio" below to publish.');
  };

  const handleDeletePiece = (id) => {
    const updatedList = piecesList.filter(p => p.id !== id);
    setPiecesList(updatedList);
    setStatus('Piece removed from list. Click "Save Archival Portfolio" to publish.');
  };

  const handleToggleSold = (id) => {
    const updatedList = piecesList.map(p => p.id === id ? { ...p, sold: !p.sold } : p);
    setPiecesList(updatedList);
  };

  const handleUpdateField = (id, key, value) => {
    const updatedList = piecesList.map(p => p.id === id ? { ...p, [key]: value } : p);
    setPiecesList(updatedList);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus('');
    try {
      const res = await savePastCollections(piecesList);

      if (res && res.error) {
        setStatus(`Error saving to cloud: ${res.error}`);
      } else {
        setStatus('Archival portfolio successfully updated and synchronized.');
      }
    } catch (err) {
      console.error(err);
      setStatus(err.message || 'Failed to save past collection changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="past_collections_tab_container">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <h2 className="font-display text-2xl text-stone-900 font-normal">Past Collections Archive</h2>
        <p className="text-sm text-stone-500">
          Document previously sourced and sold acquisitions. These pieces show up on the "Past Collections" archival portfolio screen.
        </p>
      </div>

      {status && (
        <div className="text-sm px-4 py-3 rounded border border-[#E5DFD8] bg-white text-stone-700 shadow-sm" id="past_tab_status">
          {status}
        </div>
      )}

      {/* Main Grid: Upload Form vs Current Archive */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Left: Upload Form */}
        <div className="bg-white border border-[#E5DFD8] rounded-lg p-6 space-y-4" id="past_upload_form">
          <h3 className="font-display text-lg text-stone-800 font-medium flex items-center gap-2">
            <Sparkles size={16} className="text-[#C9A84C]" />
            Archive an Acquisition
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <PhotoUploader
                value={null}
                onChange={(url) => {
                  if (url) setNewPhotos(prev => [...prev, url]);
                }}
                label="Upload Archival Photo"
              />

              {newPhotos.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 pt-1" id="new_photos_preview_grid">
                  {newPhotos.map((photoUrl, idx) => (
                    <div key={idx} className="relative aspect-square border border-stone-200 rounded overflow-hidden bg-stone-50 group">
                      <img src={photoUrl} alt="Preview Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => setNewPhotos(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove photo"
                      >
                        <Trash2 size={10} />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/60 px-1 py-0.5 rounded text-[8px] text-white font-mono">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-stone-400 italic">No images uploaded yet. Please add at least one image.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-semibold tracking-wider text-stone-500">
                Brand Label
              </label>
              <input
                type="text"
                value={newBrand}
                onChange={e => setNewBrand(e.target.value)}
                placeholder="e.g. Chanel, Cartier, Hermès"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 focus:border-[#C9A84C] focus:outline-none"
                id="past_input_brand"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-semibold tracking-wider text-stone-500">
                Acquisition Date/Season
              </label>
              <input
                type="text"
                value={newDateAdded}
                onChange={e => setNewDateAdded(e.target.value)}
                placeholder="e.g. April 2026, Summer Curation"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 focus:border-[#C9A84C] focus:outline-none"
                id="past_input_date"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-semibold tracking-wider text-stone-500">
                Editorial Description
              </label>
              <textarea
                value={newCaption}
                onChange={e => setNewCaption(e.target.value)}
                placeholder="Chevron Quilted Single Flap in rare lambskin caviar..."
                rows={3}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-900 focus:border-[#C9A84C] focus:outline-none"
                id="past_input_caption"
              />
            </div>

            {/* Sold Switch Toggle */}
            <div className="flex items-center justify-between py-2 border-t border-stone-100">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-stone-700">Display "Sold" Banner</span>
                <span className="text-[10px] text-stone-400">Shows diagonal sold ribbon over photo</span>
              </div>
              <button
                type="button"
                onClick={() => setNewSold(v => !v)}
                className="text-stone-600 hover:text-[#C9A84C] transition-all cursor-pointer"
                id="past_btn_sold_toggle"
              >
                {newSold ? <ToggleRight size={32} className="text-[#C9A84C]" /> : <ToggleLeft size={32} />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddPiece}
              className="w-full inline-flex items-center justify-center gap-2 bg-stone-900 text-white py-2.5 rounded text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 transition-colors"
              id="past_btn_add_archive"
            >
              <PlusCircle size={14} />
              Add to Archive List
            </button>
          </div>
        </div>

        {/* Right: Current Archive List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-white border border-[#E5DFD8] p-4 rounded-lg">
            <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
              Archived Pieces ({piecesList.length})
            </span>
            <span className="text-[10px] text-stone-400 font-sans">
              Modify details inline or delete permanently.
            </span>
          </div>

          {piecesList.length === 0 ? (
            <div className="text-center p-12 bg-white border border-dashed border-[#E5DFD8] rounded-lg text-stone-400">
              <BookOpen size={32} className="mx-auto text-stone-300 mb-2" />
              <p className="text-xs font-medium">No archived pieces documented yet.</p>
              <p className="text-[10px] text-stone-400 mt-1">Sourcing placeholder portfolios are displayed on the storefront.</p>
            </div>
          ) : (
            <div className="space-y-4" id="past_pieces_list">
              {piecesList.map((piece) => {
                const photosList = (() => {
                  const list = [];
                  if (Array.isArray(piece.photos)) list.push(...piece.photos);
                  if (Array.isArray(piece.photoUrls)) list.push(...piece.photoUrls);
                  if (piece.photoUrl) list.push(piece.photoUrl);
                  return [...new Set(list.filter(Boolean))];
                })();

                const photoUrl = photosList[0] || 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop';

                return (
                  <div
                    key={piece.id}
                    className="bg-white border border-[#E5DFD8] rounded-lg p-5 space-y-4"
                    id={`past_admin_item_${piece.id}`}
                  >
                    <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
                      {/* Left: Preview Image */}
                      <div className="flex gap-4 items-center w-full">
                        <div className="relative shrink-0">
                          <img
                            src={photoUrl}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded border border-stone-200"
                            referrerPolicy="no-referrer"
                          />
                          {piece.sold !== false && (
                            <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 text-[7px] font-bold uppercase text-white bg-red-600 rounded">
                              Sold
                            </span>
                          )}
                        </div>

                        {/* Middle: Editable Fields */}
                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={piece.brand || ''}
                              onChange={e => handleUpdateField(piece.id, 'brand', e.target.value)}
                              className="w-full border-b border-stone-200 hover:border-stone-300 focus:border-[#C9A84C] py-0.5 text-sm text-stone-900 focus:outline-none bg-transparent font-medium"
                            />
                            <span className="text-[9px] uppercase font-mono text-stone-400 block tracking-wider">Brand Name</span>
                          </div>

                          <div className="space-y-1">
                            <input
                              type="text"
                              value={piece.dateAdded || ''}
                              onChange={e => handleUpdateField(piece.id, 'dateAdded', e.target.value)}
                              className="w-full border-b border-stone-200 hover:border-stone-300 focus:border-[#C9A84C] py-0.5 text-sm text-stone-900 focus:outline-none bg-transparent"
                            />
                            <span className="text-[9px] uppercase font-mono text-stone-400 block tracking-wider">Acquisition Date</span>
                          </div>

                          <div className="space-y-1">
                            <input
                              type="text"
                              value={piece.caption || ''}
                              onChange={e => handleUpdateField(piece.id, 'caption', e.target.value)}
                              className="w-full border-b border-stone-200 hover:border-stone-300 focus:border-[#C9A84C] py-0.5 text-sm text-stone-900 focus:outline-none bg-transparent text-stone-600 italic font-serif"
                            />
                            <span className="text-[9px] uppercase font-mono text-stone-400 block tracking-wider">Caption/Details</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Toggle Sold & Delete Actions */}
                      <div className="flex items-center gap-4 shrink-0 border-t border-stone-100 md:border-none pt-3 md:pt-0 w-full md:w-auto justify-end">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-stone-400 uppercase">Sold?</span>
                          <button
                            type="button"
                            onClick={() => handleToggleSold(piece.id)}
                            className="text-stone-600 hover:text-[#C9A84C] transition-all cursor-pointer"
                          >
                            {piece.sold !== false ? (
                              <ToggleRight size={24} className="text-[#C9A84C]" />
                            ) : (
                              <ToggleLeft size={24} />
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeletePiece(piece.id)}
                          className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded transition-all"
                          title="Delete permanent"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Inline Photo Gallery Manager */}
                    <div className="border-t border-stone-100/60 pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                          Photos Gallery ({photosList.length})
                        </span>
                        <span className="text-[9px] text-stone-400 font-sans italic">
                          First image is used as the cover. Double-click or hover to reorder/remove.
                        </span>
                      </div>

                      {/* Thumbnails */}
                      <div className="flex flex-wrap gap-2">
                        {photosList.map((url, pIdx) => (
                          <div key={pIdx} className="relative w-14 h-14 border border-stone-200 rounded overflow-hidden bg-stone-50 group">
                            <img src={url} alt={`Thumbnail ${pIdx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            
                            {/* Actions Overlay */}
                            <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                              {pIdx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...photosList];
                                    const target = updated.splice(pIdx, 1)[0];
                                    updated.unshift(target);
                                    handleUpdateField(piece.id, 'photos', updated);
                                  }}
                                  className="px-1.5 py-0.5 bg-white text-stone-800 text-[8px] font-semibold tracking-wider uppercase rounded shadow-sm hover:bg-stone-50"
                                >
                                  Cover
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = photosList.filter((_, i) => i !== pIdx);
                                  handleUpdateField(piece.id, 'photos', updated);
                                }}
                                disabled={photosList.length <= 1}
                                className="p-0.5 bg-red-600 hover:bg-red-700 text-white rounded shadow-sm disabled:opacity-35"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>

                            <span className="absolute bottom-0.5 left-0.5 bg-black/60 px-1 py-0.2 rounded text-[7px] text-white font-mono">
                              #{pIdx + 1}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Mini Additional Photo Uploader */}
                      <div className="max-w-xs pt-1">
                        <PhotoUploader
                          value={null}
                          onChange={(url) => {
                            if (url) {
                              handleUpdateField(piece.id, 'photos', [...photosList, url]);
                            }
                          }}
                          label="Add Another Image to this Piece"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Save Bar */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 disabled:opacity-50 shadow-sm"
              id="past_save_btn"
            >
              <Save size={14} />
              {isSaving ? 'Synchronizing...' : 'Save Archival Portfolio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
