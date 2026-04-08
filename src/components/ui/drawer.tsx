import * as React from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type DrawerProps = React.ComponentProps<typeof Sheet>

function Drawer(props: DrawerProps) {
  return <Sheet {...props} />
}

type DrawerContentProps = Omit<React.ComponentProps<typeof SheetContent>, "side">

function DrawerContent({ children, ...props }: DrawerContentProps) {
  return (
    <SheetContent side="bottom" {...props}>
      {children}
    </SheetContent>
  )
}

const DrawerHeader = SheetHeader
const DrawerFooter = SheetFooter
const DrawerTitle = SheetTitle
const DrawerDescription = SheetDescription

export { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle }