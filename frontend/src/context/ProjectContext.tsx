import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ProjectItem {
  product: any;
  quantity: number;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  responsible: string;
  notes: string;
  items: ProjectItem[];
  updatedAt: number;
}

interface ProjectContextType {
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  setActiveProject: (id: string | null) => void;
  createProject: (name?: string) => Project;
  updateProjectInfo: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addItem: (product: any, quantity: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearProject: () => void;
  items: ProjectItem[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const stored = localStorage.getItem('newlife_projects');
      if (stored) return JSON.parse(stored);
      
      // Migration from old single project
      const oldDraft = localStorage.getItem('newlife_project_draft');
      if (oldDraft) {
        const parsed = JSON.parse(oldDraft);
        if (parsed.length > 0) {
          const defaultProj: Project = {
            id: Math.random().toString(36).substring(2, 9),
            name: 'Projeto Inicial',
            clientName: '',
            notes: '',
            items: parsed,
            updatedAt: Date.now()
          };
          localStorage.removeItem('newlife_project_draft');
          return [defaultProj];
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  const [activeProjectId, setActiveProject] = useState<string | null>(() => {
    try {
      return localStorage.getItem('newlife_active_project_id');
    } catch {
      return null;
    }
  });

  // Keep localStorage in sync
  useEffect(() => {
    localStorage.setItem('newlife_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('newlife_active_project_id', activeProjectId);
    } else {
      localStorage.removeItem('newlife_active_project_id');
    }
  }, [activeProjectId]);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;
  const items = activeProject ? activeProject.items : [];

  const createProject = (name?: string) => {
    const newProject: Project = {
      id: Math.random().toString(36).substring(2, 9),
      name: name || `Projeto ${projects.length + 1}`,
      clientName: '',
      responsible: '',
      notes: '',
      items: [],
      updatedAt: Date.now()
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProject(newProject.id);
    return newProject;
  };

  const updateProjectInfo = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
    ));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      setActiveProject(null);
    }
  };

  const addItem = (product: any, quantity: number) => {
    let targetProjectId = activeProject?.id;
    
    if (!targetProjectId) {
      if (projects.length > 0) {
        const latestProject = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)[0];
        targetProjectId = latestProject.id;
        setActiveProject(targetProjectId);
      } else {
        throw new Error("no_project");
      }
    }

    setProjects(prev => prev.map(p => {
      if (p.id !== targetProjectId) return p;
      
      const existing = p.items.find(item => item.product.id === product.id);
      let newItems;
      
      if (existing) {
        newItems = p.items.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [...p.items, { product, quantity }];
      }
      
      return { ...p, items: newItems, updatedAt: Date.now() };
    }));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (!activeProjectId) return;
    
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return {
        ...p,
        items: p.items.map(item => 
          item.product.id === productId ? { ...item, quantity } : item
        ),
        updatedAt: Date.now()
      };
    }));
  };

  const removeItem = (productId: number) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return {
        ...p,
        items: p.items.filter(item => item.product.id !== productId),
        updatedAt: Date.now()
      };
    }));
  };

  const clearProject = () => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return { ...p, items: [], updatedAt: Date.now() };
    }));
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      activeProjectId,
      activeProject,
      setActiveProject,
      createProject,
      updateProjectInfo,
      deleteProject,
      addItem,
      updateQuantity,
      removeItem,
      clearProject,
      items
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
