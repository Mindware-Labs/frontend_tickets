"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SheetSide = "top" | "right" | "bottom" | "left";
type SheetRootProps = React.ComponentProps<typeof SheetPrimitive.Root>;

const SheetStateContext = React.createContext<{ open: boolean }>({
  open: false,
});

function Sheet({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: SheetRootProps) {
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = isControlled ? Boolean(openProp) : internalOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  return (
    <SheetStateContext.Provider value={{ open }}>
      <SheetPrimitive.Root
        data-slot="sheet"
        open={open}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </SheetStateContext.Provider>
  );
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn("fixed inset-0 z-50 bg-transparent", className)}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: SheetSide;
}) {
  const { open } = React.useContext(SheetStateContext);
  const reduceMotion = useReducedMotion();

  const contentVariants = React.useMemo<Variants>(() => {
    const variantsBySide: Record<SheetSide, Variants> = {
      right: { open: { x: 0 }, closed: { x: "100%" } },
      left: { open: { x: 0 }, closed: { x: "-100%" } },
      top: { open: { y: 0 }, closed: { y: "-100%" } },
      bottom: { open: { y: 0 }, closed: { y: "100%" } },
    };

    return variantsBySide[side];
  }, [side]);

  return (
    <AnimatePresence>
      {open ? (
        <SheetPortal forceMount>
          <SheetPrimitive.Overlay data-slot="sheet-overlay" forceMount asChild>
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: { opacity: 1 },
                closed: { opacity: 0 },
              }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
              }
              className="fixed inset-0 z-50 bg-transparent"
            />
          </SheetPrimitive.Overlay>

          <SheetPrimitive.Content
            data-slot="sheet-content"
            forceMount
            asChild
            {...props}
          >
            <motion.div
              key={`sheet-content-${side}`}
              initial="closed"
              animate="open"
              exit="closed"
              variants={contentVariants}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
              }
              className={cn(
                "bg-background fixed z-50 flex flex-col gap-4 shadow-lg will-change-transform",
                side === "right" &&
                  "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
                side === "left" &&
                  "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
                side === "top" && "inset-x-0 top-0 h-auto border-b",
                side === "bottom" && "inset-x-0 bottom-0 h-auto border-t",
                className,
              )}
            >
              {children}
              <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </SheetPrimitive.Close>
            </motion.div>
          </SheetPrimitive.Content>
        </SheetPortal>
      ) : null}
    </AnimatePresence>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
