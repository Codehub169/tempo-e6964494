import React, { useState, useEffect } from 'react';
import { MagnifyingGlass, X, Robot } from 'phosphor-react'; // Added Robot
import { useAuth } from '../../contexts/AuthContext';
import { ChatType } from '../../utils/enums'; // Frontend enum for chat types

const NewChatModal = ({ isOpen, onClose, onStartChat, contacts: availableContacts = [] }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [groupChatName, setGroupChatName] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setFilteredContacts([]);
      return;
    }
    // Filter out the current user from the contacts list
    const contactsExcludingCurrentUser = availableContacts.filter(contact => contact.id.toString() !== user.id.toString());
    
    if (searchTerm === '') {
      setFilteredContacts(contactsExcludingCurrentUser);
    } else {
      setFilteredContacts(
        contactsExcludingCurrentUser.filter(contact =>
          contact.full_name && contact.full_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, availableContacts, user]);

  const handleToggleContact = (contactId) => {
    // contactId is already a string from contact.id.toString()
    setSelectedContactIds(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const determineChatType = () => {
    if (selectedContactIds.length === 0) return null;
    if (selectedContactIds.length === 1) {
        const selectedContact = availableContacts.find(c => c.id.toString() === selectedContactIds[0]);
        if (selectedContact && selectedContact.is_bot) { // is_bot from backend User schema
            return ChatType.BOT; // Returns string like "bot"
        }
        return ChatType.ONE_ON_ONE; // Returns string like "one_on_one"
    }
    return ChatType.GROUP; // Returns string like "group"
  };

  const handleCreateChat = () => {
    setError('');
    if (selectedContactIds.length === 0) {
      setError('Please select at least one contact.');
      return;
    }

    const chatType = determineChatType(); // This is a string like "group", "bot", etc.

    if (chatType === ChatType.GROUP && !groupChatName.trim()) {
      setError('Please enter a name for the group chat.');
      return;
    }

    onStartChat(selectedContactIds, chatType === ChatType.GROUP ? groupChatName : null, chatType);
    // Resetting state and closing modal is now handled by DashboardPage after successful creation or error in onStartChat.
  };

  if (!isOpen) return null;

  const currentChatType = determineChatType();

  return (
    <div className="modal-overlay fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300 opacity-100 visible">
      <div className="modal-content bg-surface-1 border border-border-color p-7 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col transform scale-100 transition-transform duration-300">
        <div className="modal-header flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-text-primary">Start New Chat</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-primary transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="search-bar relative mb-5">
          <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search for friends or bot..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-border-color rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {currentChatType === ChatType.GROUP && (
            <div className="mb-4">
                <input 
                    type="text"
                    placeholder="Group chat name..."
                    value={groupChatName}
                    onChange={(e) => setGroupChatName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-2 border border-border-color rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                />
            </div>
        )}

        <div className="contact-list overflow-y-auto flex flex-col gap-3.5 pr-2.5 -mr-2.5 mb-6 flex-grow">
          {filteredContacts.length > 0 ? filteredContacts.map(contact => (
            <label key={contact.id} className={`contact-item flex items-center p-2.5 rounded-lg hover:bg-surface-2 transition-colors cursor-pointer ${selectedContactIds.includes(contact.id.toString()) ? 'bg-primary/20' : ''}`}>
              <div className="avatar relative mr-3.5 shrink-0">
                <img src={contact.avatarUrl || `https://i.pravatar.cc/150?u=${contact.email}`} alt={contact.full_name || 'User'} className="w-10 h-10 rounded-full object-cover" />
                {contact.is_bot && (
                  <div className="bot-indicator absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary border-2 border-background rounded-full flex items-center justify-center">
                    <Robot size={12} className="text-text-primary" weight="bold" />
                  </div>
                )}
              </div>
              <div className="contact-info flex-grow">
                <span className="contact-name font-medium text-sm text-text-primary">{contact.full_name || 'Unnamed Contact'}</span>
              </div>
              <input
                type="checkbox"
                checked={selectedContactIds.includes(contact.id.toString())}
                onChange={() => handleToggleContact(contact.id.toString())}
                className="form-checkbox appearance-none w-5 h-5 border-2 border-border-color rounded-md cursor-pointer transition-all duration-200 relative checked:bg-primary checked:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </label>
          )) : (
            <p className='text-text-secondary text-sm text-center py-4'>No contacts found or matching search.</p>
          )}
        </div>
        {error && <p className='text-red-400 text-sm mb-3 text-center'>{error}</p>}
        <div className="modal-footer mt-auto">
          <button
            onClick={handleCreateChat}
            disabled={selectedContactIds.length === 0 || (currentChatType === ChatType.GROUP && !groupChatName.trim())}
            className="w-full py-3 px-4 border-none rounded-lg bg-primary text-text-primary text-base font-semibold cursor-pointer transition-colors duration-300 hover:bg-primary-light disabled:bg-surface-2 disabled:text-text-secondary disabled:cursor-not-allowed"
          >
            Start Chat
            {selectedContactIds.length === 1 && currentChatType === ChatType.ONE_ON_ONE && ' with 1 person'}
            {selectedContactIds.length > 1 && currentChatType === ChatType.GROUP && ` with ${selectedContactIds.length} people`}
            {currentChatType === ChatType.BOT && ' with Bot'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
