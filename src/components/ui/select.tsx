import { forwardRef } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { IcCheck } from '@/components/icons/ic-check';
import { IcChevronDown } from '@/components/icons/ic-chevron-down';
import { IcChevronUp } from '@/components/icons/ic-chevron-up';
import { cn } from '@/utils/cn';

export const Select = SelectPrimitive.Root;

export const SelectGroup = SelectPrimitive.Group;

export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(function SelectTrigger({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <IcChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const SelectScrollUpButton = forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(function SelectScrollUpButton({ className, ...props }, ref) {
  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <IcChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  );
});

export const SelectScrollDownButton = forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(function SelectScrollDownButton({ className, ...props }, ref) {
  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <IcChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  );
});

export const SelectContent = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent({ className, children, position = 'popper', ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectLabel = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(function SelectLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
      {...props}
    />
  );
});

export const SelectItem = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <IcCheck className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

export const SelectSeparator = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(function SelectSeparator({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-muted', className)}
      {...props}
    />
  );
});