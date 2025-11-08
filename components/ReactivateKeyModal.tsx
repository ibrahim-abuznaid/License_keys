'use client';

import { useState } from 'react';
import { Modal } from './Modal';

interface ReactivateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (days: number) => void;
  keyValue: string;
  email: string;
  isTrial: boolean;
}

export default function ReactivateKeyModal({
  isOpen,
  onClose,
  onConfirm,
  keyValue,
  email,
  isTrial,
}: ReactivateKeyModalProps) {
  const [days, setDays] = useState<number>(7);
  const [error, setError] = useState<string>('');

  const handleConfirm = () => {
    if (isTrial) {
      if (!days || days <= 0) {
        setError('Please enter a valid number of days');
        return;
      }
      if (days > 365) {
        setError('Days cannot exceed 365');
        return;
      }
    }
    setError('');
    onConfirm(days);
  };

  const handleClose = () => {
    setError('');
    setDays(7);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reactivate License Key">
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Key:</span> {keyValue}
          </p>
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Email:</span> {email}
          </p>
        </div>

        {isTrial ? (
          <>
            <div>
              <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-2">
                Extend trial by how many days?
              </label>
              <input
                type="number"
                id="days"
                min="1"
                max="365"
                value={days}
                onChange={(e) => {
                  setDays(Number(e.target.value));
                  setError('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter number of days"
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                The key will expire {days} days from today
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                💡 <span className="font-semibold">Trial Key:</span> This key will be extended by the specified number of days.
              </p>
            </div>
          </>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              💡 <span className="font-semibold">Subscribed Key:</span> This key will be reactivated with no expiry date.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Reactivate Key
          </button>
        </div>
      </div>
    </Modal>
  );
}

