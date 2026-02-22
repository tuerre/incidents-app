'use client'

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconAlertTriangle,
  IconHotelService,
  IconUsers,
  IconMapPin,
  IconKey,
  IconMushroomFilled,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { MountedOnly } from "@/components/mounted-only"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabase"

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Incidencias",
    url: "/dashboard/incidents",
    icon: IconAlertTriangle,
  },
  {
    title: "Áreas",
    url: "/dashboard/areas",
    icon: IconMapPin,
  },
  {
    title: "Empleados",
    url: "/dashboard/employees",
    icon: IconUsers,
  },
  {
    title: "Habitaciones",
    url: "/dashboard/rooms",
    icon: IconHotelService,
  },
  {
    title: "Sesiones",
    url: "/dashboard/sessions",
    icon: IconKey,
  },
  {
    title: "Analíticas",
    url: "/dashboard/analytics",
    icon: IconChartBar,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState({
    name: "",
    email: "",
    avatar: "",
  })

  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, role")
          .eq("id", authUser.id)
          .single()

        if (profile) {
          setUser({
            name: profile.full_name || profile.email || "",
            email: profile.email || authUser.email || "",
            avatar: "",
          })
        }
      }
    }
    fetchUser()
  }, [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconMushroomFilled className="!size-5" />
                <span className="text-base font-semibold">Amanera</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <MountedOnly>
          <NavUser user={user} />
        </MountedOnly>
      </SidebarFooter>
    </Sidebar>
  )
}
