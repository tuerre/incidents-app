import {
  IconTrendingDown,
  IconTrendingUp,
  IconAlertTriangle,
  IconClock,
  IconProgress,
  IconCircleCheck,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface SectionCardsProps {
  data: {
    total: number
    pending: number
    inProgress: number
    resolved: number
  }
}

export function SectionCards({ data }: SectionCardsProps) {
  const resolvedPercent = data.total > 0
    ? Math.round((data.resolved / data.total) * 100)
    : 0

  const pendingPercent = data.total > 0
    ? Math.round((data.pending / data.total) * 100)
    : 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Incidencias</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.total}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconAlertTriangle className="size-3" />
              Total
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Todas las incidencias registradas
          </div>
          <div className="text-muted-foreground">
            En el sistema
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pendientes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.pending}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconClock className="size-3" />
              {pendingPercent}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {data.pending > 0 ? (
              <>Requieren atención <IconTrendingUp className="size-4" /></>
            ) : (
              <>Sin pendientes <IconCircleCheck className="size-4" /></>
            )}
          </div>
          <div className="text-muted-foreground">
            Incidencias sin resolver
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>En Progreso</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.inProgress}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconProgress className="size-3" />
              Activas
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Siendo atendidas actualmente
          </div>
          <div className="text-muted-foreground">
            En proceso de resolución
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Resueltas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.resolved}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp className="size-3" />
              {resolvedPercent}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {resolvedPercent >= 50 ? (
              <>Buena tasa de resolución <IconTrendingUp className="size-4" /></>
            ) : (
              <>Necesita mejorar <IconTrendingDown className="size-4" /></>
            )}
          </div>
          <div className="text-muted-foreground">
            Incidencias completadas
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
