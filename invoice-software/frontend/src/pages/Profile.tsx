import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth';
import { API_BASE_URL, profileApi } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, setUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG or PNG)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await profileApi.uploadAvatar(formData);
      setUser(response.data.user);
      setSuccess('Avatar updated successfully!');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm('Delete your avatar?')) return;

    try {
      await profileApi.deleteAvatar();
      setUser(user ? { ...user, avatar: null } : null);
      setSuccess('Avatar deleted successfully');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete avatar');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>User Profile</h1>
          <p>Manage your account settings and profile information.</p>
        </div>
      </div>

      <div className="panel-grid">
        <Card title="Profile Information" className="panel">
          <div className="profile-info">
            <div className="info-row">
              <label>Name</label>
              <span>{user?.name}</span>
            </div>
            <div className="info-row">
              <label>Email</label>
              <span>{user?.email}</span>
            </div>
          </div>
        </Card>

        <Card title="Avatar" description="Upload a profile picture to personalize your account." className="panel">
          <div className="avatar-section">
            <div className="current-avatar">
              {user?.avatar ? (
                <img
                  src={`${API_BASE_URL}${user.avatar}`}
                  alt="Current avatar"
                  className="avatar-preview"
                />
              ) : (
                <div className="avatar-placeholder">
                  <div className="avatar-initials-large">
                    {user ? getInitials(user.name) : 'U'}
                  </div>
                </div>
              )}
            </div>

            <div className="avatar-controls">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="upload-button-trigger"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Choose file'}
              </button>

              {user?.avatar && (
                <Button variant="ghost" onClick={handleDeleteAvatar}>
                  Delete Avatar
                </Button>
              )}

              <p className="upload-hint">JPEG or PNG, max 5MB</p>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </Card>
      </div>
    </div>
  );
}
