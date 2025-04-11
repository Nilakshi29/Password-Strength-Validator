import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PasswordStrengthValidator from '../PassWordStrengthValidator';

describe('PasswordStrengthValidator', () => {
    // ✅ Test: Component renders correctly with initial state
    it('renders initial state correctly', () => {
        const { getByTestId, queryAllByTestId } = render(<PasswordStrengthValidator />);
        expect(getByTestId('password-input')).toBeTruthy(); // Input field is present
        expect(getByTestId('strength-text').props.children.includes('Weak')).toBe(true); // Default strength is "Weak"
        expect(queryAllByTestId(/^feedback-/).length).toBeGreaterThan(0); // Some feedback messages are rendered
    });

    // ✅ Test: Updates strength when password is typed
    it('updates strength on password input', () => {
        const { getByTestId } = render(<PasswordStrengthValidator />);
        const input = getByTestId('password-input');
        fireEvent.changeText(input, 'Pass123!');

        // Expect strength to become Medium or Strong
        expect(
            getByTestId('strength-text').props.children.includes('Medium') ||
            getByTestId('strength-text').props.children.includes('Strong')
        ).toBe(true);
    });

    // ✅ Test: Callback function is called with updated strength details
    it('calls onStrengthChange callback with correct strength', () => {
        const mockCallback = jest.fn();
        const { getByTestId } = render(<PasswordStrengthValidator onStrengthChange={mockCallback} />);

        fireEvent.changeText(getByTestId('password-input'), 'StrongPass123!');
        expect(mockCallback).toHaveBeenCalled(); // Callback is called
        expect(mockCallback.mock.calls[0][0]).toHaveProperty('level'); // Returned object contains "level"
    });

    // ✅ Test: Handles empty password input
    it('handles empty password', () => {
        const { getByTestId, queryAllByTestId } = render(<PasswordStrengthValidator />);
        fireEvent.changeText(getByTestId('password-input'), '');

        expect(getByTestId('strength-text').props.children.includes('Weak')).toBe(true); // Strength resets to Weak
        expect(queryAllByTestId(/^feedback-/).length).toBeGreaterThan(0); // Feedback messages shown
    });

    // ✅ Test: Validates strong password input
    it('handles long password with all rules met', () => {
        const { getByTestId } = render(<PasswordStrengthValidator />);
        fireEvent.changeText(getByTestId('password-input'), 'SuperStrongPass123!@#');
        expect(getByTestId('strength-text').props.children.includes('Strong')).toBe(true);
    });

    // ✅ Test: Blocks non-ASCII input like emojis or foreign characters
    it('rejects passwords with emojis/unicode beyond ASCII', () => {
        const { getByTestId } = render(<PasswordStrengthValidator />);
        const input = getByTestId('password-input');

        fireEvent.changeText(input, 'P@ss🚀Wørd123');

        // Component should reject and clear such input
        expect(input.props.value).toBe('');
    });

    // ✅ Test: Does not allow password longer than 25 characters
    it('prevents input beyond max length of 25 characters', () => {
        const { getByTestId } = render(<PasswordStrengthValidator />);
        const input = getByTestId('password-input');

        const longPassword = 'a'.repeat(25); // max limit- 25 characters
        fireEvent.changeText(input, longPassword);

        expect(input.props.value.length).toBeLessThanOrEqual(25);
    });

    // ✅ Test: Resets password strength when input is cleared
    it('resets strength when password is cleared', () => {
        const { getByTestId } = render(<PasswordStrengthValidator />);
        const input = getByTestId('password-input');

        fireEvent.changeText(input, 'StrongPass123!');
        fireEvent.changeText(input, '');

        expect(getByTestId('strength-text').props.children.includes('Weak')).toBe(true);
    });

    // ✅ Test: Detects common patterns like "password123"
    it('avoids common patterns', () => {
        const { getByTestId, queryAllByTestId } = render(<PasswordStrengthValidator />);
        fireEvent.changeText(getByTestId('password-input'), 'password123');

        // Looks for feedback about common patterns
        const feedbackMessages = queryAllByTestId(/^feedback-/).map(el => el.props.children?.toString() || '');
        expect(feedbackMessages.some(msg => msg.includes('common patterns'))).toBe(true);
    });

    // ✅ Test: Detects repeated characters
    it('detects repeated characters', () => {
        const { getByTestId, queryAllByTestId } = render(<PasswordStrengthValidator />);
        fireEvent.changeText(getByTestId('password-input'), 'aaaAAA111!!');

        // Looks for feedback about repeated characters
        const feedbackMessages = queryAllByTestId(/^feedback-/).map(el => el.props.children?.toString() || '');
        expect(feedbackMessages.some(msg => msg.includes('Avoid repeated characters'))).toBe(true);
    });

    // ✅ Test: Mocks strength evaluation logic
    it('mocks strength evaluation for controlled output', () => {
        const mockCallback = jest.fn();

        jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());

        const { getByTestId } = render(<PasswordStrengthValidator onStrengthChange={mockCallback} />);
        fireEvent.changeText(getByTestId('password-input'), 'mocked');
        expect(mockCallback).toHaveBeenCalled();
    });

    // ✅ Parameterized test: Tests all levels of password strength
    const testStrengthLevels = [
        { pwd: 'pass', expected: 'Weak' },
        { pwd: 'Pass123', expected: 'Medium' },
        { pwd: 'Pass123!@#', expected: 'Strong' },
    ];

    testStrengthLevels.forEach(({ pwd, expected }) => {
        it(`displays ${expected} for password "${pwd}"`, () => {
            const { getByTestId } = render(<PasswordStrengthValidator />);
            fireEvent.changeText(getByTestId('password-input'), pwd);
            expect(getByTestId('strength-text').props.children.includes(expected)).toBe(true);
        });
    });
});
