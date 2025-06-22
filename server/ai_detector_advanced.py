#!/usr/bin/env python3
"""
Advanced AI Detection System for Academic Tests
Platform-agnostic solution for detecting AI-generated responses
"""

import sys
import json
import time
import re
import hashlib
from datetime import datetime
import numpy as np

class AdvancedAIDetector:
    def __init__(self):
        self.ai_patterns = {
            'formal_transitions': [
                'furthermore', 'moreover', 'in conclusion', 'it is important to note',
                'additionally', 'consequently', 'therefore', 'in summary',
                'it should be noted', 'it is worth mentioning', 'as a result',
                'on the other hand', 'in other words', 'for instance',
                'to elaborate', 'in essence', 'fundamentally speaking',
                'it can be argued that', 'one might consider', 'it is evident that'
            ],
            'ai_phrases': [
                'as an ai', 'i am an ai', 'as a language model', 'i cannot',
                'i don\'t have personal', 'i don\'t have access to',
                'based on my training', 'according to my knowledge',
                'i\'m not able to', 'i cannot provide', 'i\'m unable to'
            ],
            'academic_markers': [
                'according to research', 'studies have shown', 'it has been established',
                'research indicates', 'evidence suggests', 'scholars argue',
                'the literature suggests', 'empirical evidence', 'theoretical framework'
            ]
        }
    
    def analyze_linguistic_patterns(self, text):
        """Analyze linguistic patterns typical of AI-generated text"""
        score = 0
        detected_patterns = []
        
        text_lower = text.lower()
        
        # Check for AI-specific phrases
        for phrase in self.ai_patterns['ai_phrases']:
            if phrase in text_lower:
                score += 40
                detected_patterns.append(f"AI identifier: '{phrase}'")
        
        # Check for formal transitions
        transition_count = 0
        for transition in self.ai_patterns['formal_transitions']:
            if transition in text_lower:
                transition_count += 1
                detected_patterns.append(f"Formal transition: '{transition}'")
        
        if transition_count > 3:
            score += 25
        elif transition_count > 1:
            score += 15
        
        # Check for academic markers
        academic_count = 0
        for marker in self.ai_patterns['academic_markers']:
            if marker in text_lower:
                academic_count += 1
                detected_patterns.append(f"Academic marker: '{marker}'")
        
        if academic_count > 2:
            score += 20
        
        return min(score, 100), detected_patterns
    
    def analyze_structural_patterns(self, text):
        """Analyze structural patterns in the text"""
        score = 0
        patterns = []
        
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if len(sentences) < 2:
            return 0, []
        
        words = text.split()
        
        # Sentence length consistency (AI tends to be more consistent)
        sentence_lengths = [len(s.split()) for s in sentences]
        if len(sentence_lengths) > 1:
            avg_length = np.mean(sentence_lengths)
            std_dev = np.std(sentence_lengths)
            
            if std_dev < 3 and avg_length > 15:
                score += 20
                patterns.append("Highly consistent sentence lengths")
            elif std_dev < 5:
                score += 10
                patterns.append("Consistent sentence structure")
        
        # Paragraph structure
        paragraphs = text.split('\n\n')
        if len(paragraphs) > 1:
            para_lengths = [len(p.split()) for p in paragraphs if p.strip()]
            if len(para_lengths) > 1 and np.std(para_lengths) < 10:
                score += 15
                patterns.append("Uniform paragraph lengths")
        
        return min(score, 100), patterns
    
    def analyze_semantic_patterns(self, text):
        """Analyze semantic patterns and content structure"""
        score = 0
        patterns = []
        
        words = text.lower().split()
        
        # Vocabulary diversity
        unique_words = set(words)
        diversity_ratio = len(unique_words) / len(words) if words else 0
        
        if diversity_ratio < 0.4:
            score += 25
            patterns.append(f"Low vocabulary diversity ({diversity_ratio:.2f})")
        elif diversity_ratio < 0.5:
            score += 15
            patterns.append(f"Moderate vocabulary diversity ({diversity_ratio:.2f})")
        
        # Repetitive word usage
        word_freq = {}
        for word in words:
            if len(word) > 3:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        repeated_words = [word for word, count in word_freq.items() if count > 3]
        if len(repeated_words) > 2:
            score += 20
            patterns.append(f"Excessive word repetition: {repeated_words[:3]}")
        
        return min(score, 100), patterns
    
    def analyze_behavioral_patterns(self, text):
        """Analyze behavioral patterns in writing"""
        score = 0
        patterns = []
        
        # Personal language indicators
        personal_pronouns = len(re.findall(r'\b(i|me|my|mine|myself)\b', text.lower()))
        total_words = len(text.split())
        
        if total_words > 50:
            personal_ratio = personal_pronouns / total_words
            if personal_ratio < 0.01:
                score += 30
                patterns.append("Lack of personal language")
            elif personal_ratio < 0.02:
                score += 15
                patterns.append("Limited personal expression")
        
        # Emotional language
        emotional_words = ['feel', 'think', 'believe', 'love', 'hate', 'excited', 'worried', 'happy', 'sad']
        emotional_count = sum(1 for word in emotional_words if word in text.lower())
        
        if emotional_count == 0 and total_words > 100:
            score += 20
            patterns.append("Absence of emotional language")
        
        # Contractions and informal language
        contractions = len(re.findall(r"\w+'\w+", text))
        if contractions == 0 and total_words > 50:
            score += 15
            patterns.append("No contractions (overly formal)")
        
        return min(score, 100), patterns
    
    def calculate_final_score(self, linguistic, structural, semantic, behavioral):
        """Calculate weighted final AI probability score"""
        weights = {
            'linguistic': 0.35,
            'structural': 0.25,
            'semantic': 0.25,
            'behavioral': 0.15
        }
        
        weighted_score = (
            linguistic * weights['linguistic'] +
            structural * weights['structural'] +
            semantic * weights['semantic'] +
            behavioral * weights['behavioral']
        )
        
        return min(weighted_score, 95)
    
    def detect_ai_content(self, text, student_id=None, question_id=None):
        """Main detection function"""
        if not text or len(text.strip()) < 20:
            return {
                'error': 'Text too short for analysis',
                'aiScore': 0.5,
                'isSuspectedAI': False
            }
        
        start_time = time.time()
        
        # Run all analysis modules
        linguistic_score, linguistic_patterns = self.analyze_linguistic_patterns(text)
        structural_score, structural_patterns = self.analyze_structural_patterns(text)
        semantic_score, semantic_patterns = self.analyze_semantic_patterns(text)
        behavioral_score, behavioral_patterns = self.analyze_behavioral_patterns(text)
        
        # Calculate final score
        final_score = self.calculate_final_score(
            linguistic_score, structural_score, semantic_score, behavioral_score
        )
        
        ai_probability = final_score / 100
        confidence = abs(ai_probability - 0.5) * 2
        
        # Determine risk level
        if ai_probability > 0.8:
            risk_level = "CRITICAL"
        elif ai_probability > 0.6:
            risk_level = "HIGH"
        elif ai_probability > 0.4:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        # Compile all detected patterns
        all_patterns = linguistic_patterns + structural_patterns + semantic_patterns + behavioral_patterns
        
        processing_time = (time.time() - start_time) * 1000
        
        result = {
            'aiScore': round(ai_probability, 3),
            'isSuspectedAI': ai_probability > 0.5,
            'confidence': round(confidence, 3),
            'riskLevel': risk_level,
            'message': f"{'Likely AI-generated' if ai_probability > 0.5 else 'Likely human-written'} (Score: {ai_probability:.1%})",
            'detailedAnalysis': {
                'linguistic': round(linguistic_score, 1),
                'structural': round(structural_score, 1),
                'semantic': round(semantic_score, 1),
                'behavioral': round(behavioral_score, 1)
            },
            'detectedPatterns': all_patterns,
            'metadata': {
                'studentId': student_id,
                'questionId': question_id,
                'timestamp': datetime.now().isoformat(),
                'processingTime': round(processing_time, 2),
                'textLength': len(text),
                'wordCount': len(text.split()),
                'model': 'AdvancedAIDetector v2.0'
            }
        }
        
        return result

def main():
    """Command line interface"""
    if len(sys.argv) < 2:
        print("Usage: python ai_detector_advanced.py <text> [student_id] [question_id]")
        sys.exit(1)
    
    text = sys.argv[1]
    student_id = sys.argv[2] if len(sys.argv) > 2 else None
    question_id = sys.argv[3] if len(sys.argv) > 3 else None
    
    detector = AdvancedAIDetector()
    result = detector.detect_ai_content(text, student_id, question_id)
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()