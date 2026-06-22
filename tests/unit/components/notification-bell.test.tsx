import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationBell } from '@/components/layout/notification-bell';
import { getUnreadNotificationsAction } from '@/modules/notification';

// Mock the server action
jest.mock('@/modules/notification', () => ({
  getUnreadNotificationsAction: jest.fn(),
  markAllNotificationsAsReadAction: jest.fn(),
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing and shows bell icon', () => {
    (getUnreadNotificationsAction as jest.Mock).mockResolvedValue({ success: true, data: [] });
    render(<NotificationBell />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays unread count badge when notifications exist', async () => {
    (getUnreadNotificationsAction as jest.Mock).mockResolvedValue({
      success: true,
      data: [
        { id: '1', title: 'Test Notif', body: 'Body', createdAt: new Date().toISOString() },
      ],
    });

    render(<NotificationBell />);
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('opens dropdown and shows notifications on click', async () => {
    (getUnreadNotificationsAction as jest.Mock).mockResolvedValue({
      success: true,
      data: [
        { id: '1', title: 'Doubt Resolved', body: 'Your doubt is fixed', createdAt: new Date().toISOString() },
      ],
    });

    render(<NotificationBell />);
    
    // Wait for initial fetch
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Click the bell
    fireEvent.click(screen.getByRole('button'));

    // Check if dropdown content is visible
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Doubt Resolved')).toBeInTheDocument();
    expect(screen.getByText('Your doubt is fixed')).toBeInTheDocument();
  });
});