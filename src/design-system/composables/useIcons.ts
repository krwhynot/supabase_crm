import { 
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  HomeIcon,
  UsersIcon,
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Bars3Icon,
  EllipsisVerticalIcon,
} from '@heroicons/vue/24/outline';

import {
  SunIcon as SunIconSolid,
  MoonIcon as MoonIconSolid,
  ComputerDesktopIcon as ComputerDesktopIconSolid,
  UserIcon as UserIconSolid,
  EnvelopeIcon as EnvelopeIconSolid,
  PhoneIcon as PhoneIconSolid,
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  BellIcon as BellIconSolid,
  CheckIcon as CheckIconSolid,
  XMarkIcon as XMarkIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  InformationCircleIcon as InformationCircleIconSolid,
} from '@heroicons/vue/24/solid';

export const outlineIcons = {
  sun: SunIcon,
  moon: MoonIcon,
  system: ComputerDesktopIcon,
  user: UserIcon,
  envelope: EnvelopeIcon,
  phone: PhoneIcon,
  building: BuildingOfficeIcon,
  home: HomeIcon,
  users: UsersIcon,
  settings: Cog6ToothIcon,
  bell: BellIcon,
  search: MagnifyingGlassIcon,
  plus: PlusIcon,
  pencil: PencilIcon,
  trash: TrashIcon,
  eye: EyeIcon,
  check: CheckIcon,
  x: XMarkIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  chevronUp: ChevronUpIcon,
  chevronDown: ChevronDownIcon,
  menu: Bars3Icon,
  dots: EllipsisVerticalIcon,
};

export const solidIcons = {
  sun: SunIconSolid,
  moon: MoonIconSolid,
  system: ComputerDesktopIconSolid,
  user: UserIconSolid,
  envelope: EnvelopeIconSolid,
  phone: PhoneIconSolid,
  building: BuildingOfficeIconSolid,
  home: HomeIconSolid,
  users: UsersIconSolid,
  settings: Cog6ToothIconSolid,
  bell: BellIconSolid,
  search: MagnifyingGlassIcon, // Add missing solid icons
  plus: PlusIcon,
  pencil: PencilIcon,
  trash: TrashIcon,
  eye: EyeIcon,
  check: CheckIconSolid,
  x: XMarkIconSolid,
  warning: ExclamationTriangleIconSolid,
  info: InformationCircleIconSolid,
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  chevronUp: ChevronUpIcon,
  chevronDown: ChevronDownIcon,
  menu: Bars3Icon,
  dots: EllipsisVerticalIcon,
};

export type IconName = keyof typeof outlineIcons;
export type IconVariant = 'outline' | 'solid';

export function useIcons() {
  const getIcon = (name: IconName, variant: IconVariant = 'outline') => {
    if (variant === 'solid' && name in solidIcons) {
      return solidIcons[name as keyof typeof solidIcons];
    }
    return outlineIcons[name];
  };

  return {
    outlineIcons,
    solidIcons,
    getIcon,
  };
}