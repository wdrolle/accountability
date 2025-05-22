declare module 'react-ios-time-picker' {
  interface TimePickerProps {
    value: string;
    onChange: (value: string) => void;
    pickerDefaultValue?: string;
    required?: boolean;
    cellHeight?: number;
    placeHolder?: string;
    cancelButtonText?: string;
    saveButtonText?: string;
    controllers?: boolean;
    seperator?: boolean;
    onSave?: (value: string) => void;
    onClose?: () => void;
  }
  
  export const TimePicker: React.FC<TimePickerProps>;
} 