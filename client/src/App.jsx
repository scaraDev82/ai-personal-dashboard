import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  X, 
  ExternalLink, 
  Edit2, 
  Search, 
  GripVertical
} from 'lucide-react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const API_BASE = 'http://localhost:3001/api';

function SortableLink({ link, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `link-${link.id}`, data: { type: 'link', link } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="link-item sortable-item">
      <div {...attributes} {...listeners} className="drag-handle">
        <GripVertical size={14} />
      </div>
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="link-content">
        <span className="link-name">{link.name}</span>
        <ExternalLink size={12} className="link-icon" />
      </a>
      <div className="link-actions actions">
        <button onClick={() => onEdit(link)} title="Edit Link"><Edit2 size={12} /></button>
        <button onClick={() => onDelete(link.id)} title="Delete Link"><X size={12} /></button>
      </div>
    </div>
  );
}

function SortableCategory({ category, links, onEdit, onDelete, onAddLink, onEditLink, onDeleteLink }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `category-${category.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1
  };

  return (
    <div ref={setNodeRef} style={style} className="category-card">
      <div className="category-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div {...attributes} {...listeners} className="drag-handle">
            <GripVertical size={14} />
          </div>
          <h2 className="category-title">{category.name}</h2>
        </div>
        <div className="category-actions actions">
          <button onClick={() => onAddLink(category.id)} title="Add Link"><Plus size={14} /></button>
          <button onClick={() => onDelete(category.id)} title="Delete Category"><X size={14} /></button>
        </div>
      </div>
      <div className="links-list">
        <SortableContext items={links.map(l => `link-${l.id}`)} strategy={verticalListSortingStrategy}>
          {links.map(link => (
            <SortableLink 
              key={link.id} 
              link={link} 
              onEdit={onEditLink} 
              onDelete={onDeleteLink} 
            />
          ))}
        </SortableContext>
        {links.length === 0 && (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#333', fontSize: '0.7rem' }}>
            EMPTY_SECTION
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [panels, setPanels] = useState([]);
  const [activePanelId, setActivePanelId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [links, setLinks] = useState([]);
  
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isPanelModalOpen, setIsPanelModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', id: null, message: '' });
  
  const [editingLink, setEditingLink] = useState(null);
  const [editingPanel, setEditingPanel] = useState(null);
  
  const [linkForm, setLinkForm] = useState({ name: '', url: '', category_id: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [panelForm, setPanelForm] = useState({ name: '' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchPanels();
  }, []);

  useEffect(() => {
    if (activePanelId) {
      fetchCategories();
      fetchLinks();
    }
  }, [activePanelId]);

  const fetchPanels = async () => {
    try {
      const res = await axios.get(`${API_BASE}/panels`);
      setPanels(res.data);
      if (res.data.length > 0 && !activePanelId) {
        setActivePanelId(res.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching panels:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/categories?panel_id=${activePanelId}`);
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchLinks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/links`);
      setLinks(res.data);
    } catch (err) {
      console.error('Error fetching links:', err);
    }
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLink) {
        await axios.put(`${API_BASE}/links/${editingLink.id}`, linkForm);
      } else {
        await axios.post(`${API_BASE}/links`, linkForm);
      }
      setIsLinkModalOpen(false);
      setEditingLink(null);
      setLinkForm({ name: '', url: '', category_id: '' });
      fetchLinks();
    } catch (err) {
      console.error('Error saving link:', err);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/categories`, { ...categoryForm, panel_id: activePanelId });
      setIsCategoryModalOpen(false);
      setCategoryForm({ name: '' });
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  const handlePanelSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingPanel) {
        res = await axios.put(`${API_BASE}/panels/${editingPanel.id}`, panelForm);
      } else {
        res = await axios.post(`${API_BASE}/panels`, panelForm);
      }
      setIsPanelModalOpen(false);
      setEditingPanel(null);
      setPanelForm({ name: '' });
      fetchPanels();
      if (res.data.id) setActivePanelId(res.data.id);
    } catch (err) {
      console.error('Error saving panel:', err);
    }
  };

  const deleteLink = (id) => setConfirmModal({ isOpen: true, type: 'link', id, message: 'CONFIRM_DELETION: LINK_DATA' });
  const deleteCategory = (id) => setConfirmModal({ isOpen: true, type: 'category', id, message: 'CONFIRM_DELETION: CATEGORY_BLOCK + ASSOCIATED_LINKS' });
  const deletePanel = (id) => setConfirmModal({ isOpen: true, type: 'panel', id, message: 'CONFIRM_DELETION: FULL_PANEL_DATA + ALL_ASSOCIATED_RESOURCES' });

  const executeDelete = async () => {
    const { type, id } = confirmModal;
    try {
      if (type === 'link') await axios.delete(`${API_BASE}/links/${id}`);
      if (type === 'category') await axios.delete(`${API_BASE}/categories/${id}`);
      if (type === 'panel') {
        await axios.delete(`${API_BASE}/panels/${id}`);
        if (id === activePanelId) {
          const remaining = panels.filter(p => p.id !== id);
          setActivePanelId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
      setConfirmModal({ isOpen: false, type: '', id: null, message: '' });
      fetchPanels();
      fetchCategories();
      fetchLinks();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId.startsWith('category-') && overId.startsWith('category-')) {
      const oldIndex = categories.findIndex(c => `category-${c.id}` === activeId);
      const newIndex = categories.findIndex(c => `category-${c.id}` === overId);
      if (oldIndex !== newIndex) {
        const newCategories = arrayMove(categories, oldIndex, newIndex);
        setCategories(newCategories);
        const updates = newCategories.map((cat, index) => ({ id: cat.id, display_order: index + 1 }));
        await axios.put(`${API_BASE}/categories/reorder`, { categories: updates });
      }
    } else if (activeId.startsWith('link-')) {
      const activeLink = active.data.current.link;
      let newCategoryId = activeLink.category_id;
      if (overId.startsWith('category-')) {
        newCategoryId = parseInt(overId.replace('category-', ''));
      } else if (overId.startsWith('link-')) {
        newCategoryId = over.data.current.link.category_id;
      }

      const activeLinkIndex = links.findIndex(l => `link-${l.id}` === activeId);
      const overIndex = links.findIndex(l => `link-${l.id}` === overId);
      let newLinks = [...links];
      if (activeLink.category_id !== newCategoryId) {
        newLinks[activeLinkIndex] = { ...activeLink, category_id: newCategoryId };
      }
      if (overId.startsWith('link-')) {
        newLinks = arrayMove(newLinks, activeLinkIndex, overIndex);
      } else {
        const catLinks = newLinks.filter(l => l.category_id === newCategoryId);
        const otherLinks = newLinks.filter(l => l.category_id !== newCategoryId);
        newLinks = [...otherLinks, ...catLinks.filter(l => l.id !== activeLink.id), newLinks[activeLinkIndex]];
      }
      setLinks(newLinks);
      const updates = newLinks.map((l, index) => ({ id: l.id, display_order: index + 1, category_id: l.category_id }));
      await axios.put(`${API_BASE}/links/reorder`, { links: updates });
    }
  };

  return (
    <div className="app">
      <header className="dashboard-header">
        <div className="title-group">
          <h1>COMMAND CENTER</h1>
          <div className="status-line">SYSTEM STATUS: OPERATIONAL | PORT: 3001 | {new Date().toLocaleDateString()}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-primary" onClick={() => { setPanelForm({ name: '' }); setIsPanelModalOpen(true); }}>[+] PANEL</button>
          <button className="btn-primary" onClick={() => setIsCategoryModalOpen(true)}>[+] CATEGORY</button>
        </div>
      </header>

      <div className="panel-switcher">
        {panels.map(panel => (
          <div key={panel.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              onClick={() => setActivePanelId(panel.id)}
              style={{ 
                fontSize: '0.8rem', 
                textTransform: 'uppercase', 
                padding: '0.4rem 0.8rem',
                border: '1px solid transparent',
                background: activePanelId === panel.id ? 'var(--border)' : 'transparent',
                color: activePanelId === panel.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                letterSpacing: '0.1em'
              }}
            >
              {panel.name}
            </button>
            {activePanelId === panel.id && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setEditingPanel(panel); setPanelForm({ name: panel.name }); setIsPanelModalOpen(true); }} style={{ color: 'var(--text-secondary)' }}><Edit2 size={12} /></button>
                {panels.length > 1 && <button onClick={(e) => { e.stopPropagation(); deletePanel(panel.id); }} style={{ color: 'var(--text-secondary)' }}><X size={14} /></button>}
              </>
            )}
          </div>
        ))}
      </div>

      <main className="categories-grid">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map(c => `category-${c.id}`)} strategy={verticalListSortingStrategy}>
            {categories.map(category => (
              <SortableCategory 
                key={category.id} 
                category={category} 
                links={links.filter(l => l.category_id === category.id)}
                onDelete={deleteCategory}
                onAddLink={(id) => { setLinkForm({ ...linkForm, category_id: id }); setIsLinkModalOpen(true); }}
                onEditLink={(link) => { setEditingLink(link); setLinkForm(link); setIsLinkModalOpen(true); }}
                onDeleteLink={deleteLink}
              />
            ))}
          </SortableContext>
        </DndContext>
      </main>

      {/* Modals Re-implementation... */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ borderColor: '#ff4444' }}>
            <h3 className="modal-title" style={{ color: '#ff4444' }}>[ DELETE ]</h3>
            <p style={{ fontSize: '0.8rem', color: '#ff4444', marginBottom: '1.5rem' }}>{confirmModal.message}</p>
            <div className="modal-actions">
              <button onClick={() => setConfirmModal({ isOpen: false, type: '', id: null, message: '' })}>CANCEL</button>
              <button onClick={executeDelete} style={{ color: '#ff4444' }}>PROCEED_DELETE</button>
            </div>
          </div>
        </div>
      )}

      {isLinkModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">{editingLink ? 'EDIT_LINK' : 'ADD_LINK'}</h3>
            <form onSubmit={handleLinkSubmit}>
              <div className="form-group"><label>NAME</label><input required value={linkForm.name} onChange={e => setLinkForm({ ...linkForm, name: e.target.value })} /></div>
              <div className="form-group"><label>URL</label><input required type="url" value={linkForm.url} onChange={e => setLinkForm({ ...linkForm, url: e.target.value })} /></div>
              <div className="form-group">
                <label>CATEGORY</label>
                <select value={linkForm.category_id} onChange={e => setLinkForm({ ...linkForm, category_id: e.target.value })}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsLinkModalOpen(false)}>CANCEL</button>
                <button type="submit" className="btn-primary">SAVE</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">ADD_CATEGORY</h3>
            <form onSubmit={handleCategorySubmit}>
              <div className="form-group">
                <label>NAME</label>
                <input 
                  autoFocus
                  required 
                  value={categoryForm.name} 
                  onChange={e => setCategoryForm({ name: e.target.value })} 
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)}>CANCEL</button>
                <button type="submit" className="btn-primary">SAVE</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPanelModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">{editingPanel ? 'RENAME_PANEL' : 'ADD_PANEL'}</h3>
            <form onSubmit={handlePanelSubmit}>
              <div className="form-group">
                <label>NAME</label>
                <input 
                  autoFocus
                  required 
                  value={panelForm.name} 
                  onChange={e => setPanelForm({ name: e.target.value })} 
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setIsPanelModalOpen(false); setEditingPanel(null); }}>CANCEL</button>
                <button type="submit" className="btn-primary">SAVE</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
