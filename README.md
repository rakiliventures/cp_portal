# Catholic Professional (CP) Management System

A cloud-based web portal for the Catholic Professional group: membership, finances, attendance, events, and communication.

## Documentation

| Document | Purpose |
|----------|---------|
| **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** | Full design: architecture, roles, modules, data models, security, implementation roadmap |
| **[docs/USER_FLOWS.md](docs/USER_FLOWS.md)** | User flows and use cases for Admin and Member actions |
| **[docs/REQUIREMENTS_MATRIX.md](docs/REQUIREMENTS_MATRIX.md)** | Traceability: committee requirements → design sections |

## Summary of the Solution

- **Roles:** Super Admin, Admin/Official (treasurer, officials), Member  
- **Finance:** Upload parish paybill export → auto-match to members → CP-KITTY / CP-Welfare balances and arrears; member self-service dashboard  
- **Attendance:** Officials mark via checklist; optional self-registration link; reports and CP Score input  
- **Events:** Calendar, reminders (e.g. 7 days / 1 day before), past-event repository (reports, lessons learned)  
- **Compliance:** Automated arrears reminders; 13-month rule → standardized exit message + removal from WhatsApp/Telegram  
- **CP Score:** 50% attendance, 40% financial, 10% mentorship; top performers on dashboard  

## Next Steps

1. Review design and requirements matrix with the Digitization Committee.  
2. Confirm open decisions (see DESIGN_SYSTEM.md §10 Appendix B).  
3. Proceed with Phase 1 implementation (auth, RBAC, member CRUD, onboarding).
