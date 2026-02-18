# M0-T2: Component Architecture (Atomic Design)

Use Atomic Design for React Native:
- **Atoms:** foundational UI (`Button`, `Text`, `Input`, `Icon`, `Avatar`, `Badge`).
- **Molecules:** small composed units (`TaskCardHeader`, `PointsSummary`, `PINInputRow`).
- **Organisms:** feature-level sections (`TaskApprovalList`, `ChildDashboardPanel`, `LessonProgressSection`).
- **Templates:** layout structures per role (`ParentHomeTemplate`, `ChildKioskTemplate`).
- **Pages/Screens:** route-level screens built from templates + state/data wiring.

Guidelines:
- Keep presentational concerns in components; move data access to hooks/services.
- Reuse atoms first, then compose upward.
- Keep props strongly typed with TypeScript strict mode.
