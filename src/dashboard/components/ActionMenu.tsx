import DashboardActionMenu from './DashboardActionMenu';

export type ActionMenuItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export default function ActionMenu({
  label,
  items,
}: {
  label: string;
  items: ActionMenuItem[];
}) {
  return (
    <DashboardActionMenu
      label={label}
      actions={items.map((item) => ({
        label: item.label,
        onClick: item.onClick,
        danger: item.danger,
        disabled: item.disabled,
      }))}
    />
  );
}
