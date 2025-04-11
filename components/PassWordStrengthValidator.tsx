import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';

// Define the structure for password strength criteria
interface StrengthCriteria {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  specialChars: boolean;
  noRepeatedChars: boolean;
  noCommonPatterns: boolean;
}

// Define the structure for overall strength evaluation
interface Strength {
  level: 'Weak' | 'Medium' | 'Strong';
  score: number;
  maxScore: number;
  criteria: StrengthCriteria;
  feedback: string[];
}

// Props that can be customized externally
interface Props {
  onStrengthChange?: (strength: Strength) => void;
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  preventRepeatedChars?: boolean;
  preventCommonPatterns?: boolean;
}

// Common weak patterns to check against
const commonPatterns = [
  '123456',
  'password',
  'qwerty',
  'abc123',
  'abcdefghijklmnopqrstuvwxyz',
  '123456789',
];

// Helper to restrict input to ASCII characters
const isAsciiOnly = (str: string) => /^[\x00-\x7F]*$/.test(str);

// Labels for rendering criteria feedback
const criteriaMap = [
  { key: 'length', label: 'Minimum Length (8)' },
  { key: 'uppercase', label: 'Uppercase Letters' },
  { key: 'lowercase', label: 'Lowercase Letters' },
  { key: 'numbers', label: 'Numbers' },
  { key: 'specialChars', label: 'Special Characters' },
  { key: 'noRepeatedChars', label: 'No repeated characters' },
  { key: 'noCommonPatterns', label: 'No common patterns' },
];

const PasswordStrengthValidator: React.FC<Props> = ({
  onStrengthChange,
  minLength = 8,
  requireUppercase = true,
  requireLowercase = true,
  requireNumbers = true,
  requireSpecialChars = true,
  preventRepeatedChars = true,
  preventCommonPatterns = true,
}) => {
  const [password, setPassword] = useState('');

  // Default initial strength state
  const [strength, setStrength] = useState<Strength>({
    level: 'Weak',
    score: 0,
    maxScore: 7,
    criteria: {
      length: false,
      uppercase: false,
      lowercase: false,
      numbers: false,
      specialChars: false,
      noRepeatedChars: false,
      noCommonPatterns: false,
    },
    feedback: [],
  });

  // Core logic to evaluate a password based on selected rules
  const evaluatePassword = (pwd: string): Strength => {
    let score = 0;

    // Check each rule and store results in `criteria`
    const criteria: StrengthCriteria = {
      length: pwd.length >= minLength,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      numbers: /\d/.test(pwd),
      specialChars: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      noRepeatedChars: !/(.)\1{2,}/.test(pwd),
      noCommonPatterns: !commonPatterns.some((pattern) =>
        pwd.toLowerCase().includes(pattern)
      ),
    };

    // Count how many criteria passed
    Object.values(criteria).forEach((value) => value && score++);

    // Generate feedback for unmet conditions
    const feedback: string[] = [];
    if (!criteria.length) feedback.push(`Minimum ${minLength} characters`);
    if (requireUppercase && !criteria.uppercase) feedback.push('Add uppercase letters');
    if (requireLowercase && !criteria.lowercase) feedback.push('Add lowercase letters');
    if (requireNumbers && !criteria.numbers) feedback.push('Add numbers');
    if (requireSpecialChars && !criteria.specialChars) feedback.push('Add special characters');
    if (preventRepeatedChars && !criteria.noRepeatedChars) feedback.push('Avoid repeated characters');
    if (preventCommonPatterns && !criteria.noCommonPatterns) feedback.push('Avoid common patterns');

    // Set strength level based on score
    let level: Strength['level'] = 'Weak';
    if (score >= 6) level = 'Strong';
    else if (score >= 4) level = 'Medium';

    return {
      level,
      score,
      maxScore: 7,
      criteria,
      feedback,
    };
  };

  // Re-evaluate strength whenever password changes
  useEffect(() => {
    const result = evaluatePassword(password);
    setStrength(result);
    onStrengthChange?.(result); // Notify parent if provided
  }, [password]);

  // Limit input to 25 ASCII characters
  const handlePasswordChange = (text: string) => {
    if (text.length > 25 || !isAsciiOnly(text)) return;
    setPassword(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={handlePasswordChange}
          placeholder="Enter password"
          secureTextEntry
          style={styles.input}
          testID="password-input"
          maxLength={25}
        />

        <Text style={[styles.strengthText, { color: getColor(strength.level) }]} testID="strength-text">
          Strength: {strength.level}
        </Text>

        <View style={styles.divider} />

        {/* Feedback messages shown dynamically */}
        {strength.feedback.length === 0 ? (
          <Text style={styles.feedbackHint} testID="feedback-hint-0">• Please enter a password</Text>
        ) : (
          strength.feedback.map((fb, idx) => (
            <Text key={idx} style={styles.feedbackHint} testID={`feedback-hint-${idx}`}>
              • {fb}
            </Text>
          ))
        )}

        {/* Visual display of criteria satisfaction */}
        <ScrollView style={styles.criteriaList}>
          {criteriaMap.map(({ key, label }) => (
            <View key={key} style={styles.criteriaItem} testID={`feedback-${key}`}>
              <View
                style={[
                  styles.circle,
                  strength.criteria[key as keyof StrengthCriteria]
                    ? styles.circleActive
                    : styles.circleInactive,
                ]}
              />
              <Text style={styles.criteriaText}>{label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

// Strength level color coding
const getColor = (level: 'Weak' | 'Medium' | 'Strong'): string => {
  switch (level) {
    case 'Weak':
      return 'red';
    case 'Medium':
      return 'orange';
    case 'Strong':
      return 'green';
    default:
      return 'gray';
  }
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: '#000',
  },
  strengthText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginBottom: 8,
  },
  feedbackHint: {
    color: '#555',
    fontSize: 14,
    marginBottom: 8,
  },
  criteriaList: {
    marginTop: 4,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  circleActive: {
    backgroundColor: 'green',
  },
  circleInactive: {
    backgroundColor: '#ccc',
  },
  criteriaText: {
    color: '#000',
    fontSize: 14,
  },
});

export default PasswordStrengthValidator;
