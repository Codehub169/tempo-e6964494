import React, { useState, useEffect } from 'react';
import { PhMagnifyingGlass, PhX, PhRobot, PhUser, PhUsers } from 'phosphor-react';

// Dummy contacts data, including a bot
const dummyContacts = [
  {
    id: 'gemini-bot',
    name: 'Gemini Bot',
    isBot: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=gemini',
  },
  {
    id: 'user1',
    name: 'Jane Doe',
    isBot: false,
    avatarUrl: 'https://i.pravatar.cc/150?u=jane',
    onlineStatus: true,
  },
  {
    id: 'user2',
    name: 'Alex Ray',
    isBot: false,
    avatarUrl: 'https://i.pravatar.cc/150?u=alex',
    onlineStatus: false,
  },
  {
    id: 'user3',
    name: 'Sam Wilson',
    isBot: false,
    avatarUrl: 'https://i.pravatar.cc/150?u=sam',
    onlineStatus: true,
  },
];

const NewChatModal = ({ isOpen, onClose, onStartChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState(dummyContacts);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredContacts(dummyContacts);
    } else {
      setFilteredContacts(
        dummyContacts.filter(contact =>
          contact.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm]);

  const handleToggleContact = (contactId) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleStartChat = () => {
    if (selectedContacts.length > 0) {
      onStartChat(selectedContacts);
      setSelectedContacts([]);
      setSearchTerm('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300 opacity-100 visible">
      <div className="modal-content bg-surface-1 border border-border-color p-7 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col transform scale-100 transition-transform duration-300">
        <div className="modal-header flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-text-primary">Start New Chat</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-primary transition-colors">
            <PhX size={24} />
          </button>
        </div>

        <div className="search-bar relative mb-5">
          <PhMagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search for friends or bot..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-border-color rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="contact-list overflow-y-auto flex flex-col gap-3.5 pr-2.5 -mr-2.5 mb-6 flex-grow">
          {filteredContacts.length > 0 ? filteredContacts.map(contact => (
            <label key={contact.id} className="contact-item flex items-center p-2.5 rounded-lg hover:bg-surface-2 transition-colors cursor-pointer">
              <div className="avatar relative mr-3.5 shrink-0">
                <img src={contact.avatarUrl} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                {contact.isBot && (
                  <div className="bot-indicator absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary border-2 border-background rounded-full flex items-center justify-center">
                    <PhRobot size={10} className="text-text-primary" weight="bold" />
                  </div>
                )}
                {contact.onlineStatus && !contact.isBot && (
                   <span className="status absolute bottom-0 right-0 w-3 h-3 bg-green border-2 border-background rounded-full"></span>
                )}
              </div>
              <div className="contact-info flex-grow">
                <span className="contact-name font-medium text-sm text-text-primary">{contact.name}</span>
              </div>
              <input
                type="checkbox"
                checked={selectedContacts.includes(contact.id)}
                onChange={() => handleToggleContact(contact.id)}
                className="form-checkbox appearance-none w-5 h-5 border-2 border-border-color rounded-md cursor-pointer transition-all duration-200 relative checked:bg-primary checked:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </label>
          )) : (
            <p className='text-text-secondary text-sm text-center py-4'>No contacts found.</p>
          )}
        </div>

        <div className="modal-footer mt-auto">
          <button
            onClick={handleStartChat}
            disabled={selectedContacts.length === 0}
            className="w-full py-3 px-4 border-none rounded-lg bg-primary text-text-primary text-base font-semibold cursor-pointer transition-colors duration-300 hover:bg-primary-light disabled:bg-surface-2 disabled:text-text-secondary disabled:cursor-not-allowed"
          >
            Start Chat {selectedContacts.length > 1 ? `with ${selectedContacts.length} people` : selectedContacts.length === 1 ? (dummyContacts.find(c=>c.id === selectedContacts[0])?.isBot ? 'with Bot' : 'with 1 person') : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
