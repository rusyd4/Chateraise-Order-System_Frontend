"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import UnauthorizedModal from "@/components/ui/unauthorized-modal";

interface AuthContextType {
  showUnauthorizedModal: (message?: string) => void;
  hideUnauthorizedModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | undefined>();

  const showUnauthorizedModal = (message?: string) => {
    setModalMessage(message);
    setIsModalOpen(true);
  };

  const hideUnauthorizedModal = () => {
    setIsModalOpen(false);
    setModalMessage(undefined);
  };

  // Set up global auth handler when provider mounts
  React.useEffect(() => {
    const { setGlobalAuthHandler } = require("./api");
    setGlobalAuthHandler(showUnauthorizedModal);
    
    return () => {
      setGlobalAuthHandler(null);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ showUnauthorizedModal, hideUnauthorizedModal }}>
      {children}
      <UnauthorizedModal
        isOpen={isModalOpen}
        onClose={hideUnauthorizedModal}
        message={modalMessage}
      />
    </AuthContext.Provider>
  );
}; 