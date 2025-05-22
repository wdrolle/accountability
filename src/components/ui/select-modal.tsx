"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SelectModalProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}

export function SelectModal({ label, value, options, onChange }: SelectModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedValue, setSelectedValue] = useState(value);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    onChange(value);
    onClose();
  };

  const selectedLabel = options.find(opt => opt.value === value)?.label || "Select...";

  return (
    <div className="w-full">
      <Button
        variant="flat"
        onPress={onOpen}
        className="w-full justify-between px-4 py-2 h-14
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-white
          border border-gray-200 dark:border-gray-700
          hover:bg-gray-100 dark:hover:bg-gray-700
          transition-colors duration-200
          mb-2"
      >
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</span>
          <span className="text-sm font-medium">{selectedLabel}</span>
        </div>
      </Button>

      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        className="dark:bg-gray-800"
        size="md"
        placement="center"
        hideCloseButton
      >
        <ModalContent className="py-2">
          <div className="relative border-b border-gray-200 dark:border-gray-700">
            <ModalHeader className="text-gray-900 dark:text-white px-6 py-4">
              <h3 className="text-lg font-semibold">{label}</h3>
            </ModalHeader>
            <Button
              isIconOnly
              variant="light"
              onPress={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2
                w-8 h-8 min-w-0
                bg-primary rounded-full
                hover:bg-primary/90
                transition-colors duration-200
                flex items-center justify-center"
            >
              <X 
                className="h-4 w-4 text-white"
                strokeWidth={2.5}
              />
            </Button>
          </div>
          <ModalBody className="gap-1 px-4 py-4">
            {options.map((option) => (
              <Button
                key={option.value}
                variant="flat"
                className={`w-full justify-start px-6 py-4 mb-1 rounded-lg
                  ${option.value === selectedValue
                    ? "bg-primary/10 text-primary"
                    : "bg-transparent text-gray-900 dark:text-white"
                  }
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  transition-colors duration-200`}
                onPress={() => handleSelect(option.value)}
              >
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{option.label}</span>
                  {option.value === selectedValue && (
                    <span className="text-xs text-primary/80 mt-1">Selected</span>
                  )}
                </div>
              </Button>
            ))}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
} 