declare module 'react-timeit' {
  interface TimeitProps {
    onChange?: (value: string) => void;
    defaultValue?: string;
    minuteExclude?: number[];
    hourExclude?: number[];
    notShowExclude?: boolean;
    style?: React.CSSProperties;
  }

  const Timeit: React.FC<TimeitProps>;
  export default Timeit;
} 