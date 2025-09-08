export enum GameState {
  Start = 'start',
  BasicInfo = 'basic_info',
  Quiz = 'quiz',
  Results = 'results',
}

export enum QuestionType {
  Stars = 'stars',
  Checkboxes = 'checkboxes',
  Slider = 'slider',
  Text = 'text',
  Number = 'number',
}

export interface CheckboxOption {
  label: string;
  value: string;
  score: number;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: CheckboxOption[];
  min?: number;
  max?: number;
  step?: number;
  labels?: string[];
  isOptional?: boolean;
  placeholder?: string;
  validationMessage?: string;
}

export interface Answer {
  value: any;
  details?: string;
}

export interface HealthStats {
    projectedWeight: number;
    projectedHeight: string;
    bmi: number;
    calorieIntake: number;
    lifeExpectancy: number;
}
