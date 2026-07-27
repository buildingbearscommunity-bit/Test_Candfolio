import { 
  BrainCircuit, 
  BarChart3, 
  Database, 
  ShieldCheck, 
  Cloud, 
  Code, 
  Smartphone, 
  Cpu, 
  Megaphone, 
  Briefcase, 
  Sparkles
} from 'lucide-react';
import BrandLogoIcon from './BrandLogoIcon';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BrainCircuit,
  BarChart3,
  Database,
  ShieldCheck,
  Cloud,
  Code,
  Smartphone,
  Cpu,
  Megaphone,
  Briefcase,
  Sparkles,
  BookOpen: BrandLogoIcon,
  book: BrandLogoIcon
};

export default function CourseIcon({ name, className = 'w-6 h-6' }: { name: string; className?: string }) {
  const IconComponent = iconMap[name] || BrandLogoIcon;
  return <IconComponent className={className} />;
}
