import React, { createContext, useContext, useState, useEffect } from 'react';

interface CompareContextType {
  compareList: any[];
  addToCompare: (product: any) => void;
  removeFromCompare: (id: number) => void;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareList, setCompareList] = useState<any[]>(() => {
    const saved = localStorage.getItem('nlf_compare');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('nlf_compare', JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = (product: any) => {
    if (compareList.length >= 3) {
      alert('Você pode comparar no máximo 3 equipamentos por vez.');
      return;
    }
    if (!compareList.find(p => p.id === product.id)) {
      setCompareList([...compareList, product]);
    }
  };

  const removeFromCompare = (id: number) => {
    setCompareList(compareList.filter(p => p.id !== id));
  };

  const clearCompare = () => setCompareList([]);

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
