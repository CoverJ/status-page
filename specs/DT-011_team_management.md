# DT-011: Team Member Management

**Epic:** Admin Dashboard - Page Management
**Priority:** Medium
**Estimate:** Large
**Dependencies:** DT-007, DT-008, DT-031

---

## Description

Allow page owners to invite team members, manage roles, and remove team members from their status page.

---

## Acceptance Criteria

- [ ] Team members list showing email, name, role, joined date
- [ ] Only page owners can access team management
- [ ] Invite form with email and role selection
- [ ] Invitation email sent to new team members
- [ ] Accept invitation flow (creates account if needed)
- [ ] Role change capability (owner only)
- [ ] Remove team member capability (owner cannot remove self)
- [ ] Pending invitations list with resend/cancel options
- [ ] Invitation tokens expire after 7 days

---

## Technical Notes

### Team Management Page
```astro
// src/pages/app/[pageId]/team/index.astro
---
import { requireOwner } from '@/lib/auth/guards';
import DashboardLayout from '@/components/dashboard/Layout.astro';
import { createDb, TeamMemberRepository, TeamInvitationRepository, UserRepository } from '@/db';

const { pageId } = Astro.params;
const authResponse = await requireOwner(Astro, pageId);
if (authResponse) return authResponse;

const db = createDb(Astro.locals.runtime.env.DB);

// Get team members with user details
const teamMembers = await TeamMemberRepository.findByPageWithUsers(db, pageId);

// Get pending invitations
const invitations = await TeamInvitationRepository.findPendingByPage(db, pageId);

const { user, membership } = Astro.locals;
const page = await PageRepository.findById(db, pageId);
---

<DashboardLayout pageId={pageId} pageName={page.name} user={user} role={membership.role} title="Team">
  <div class="team-container">
    <div class="team-header">
      <h1>Team Members</h1>
      <button class="btn btn-primary" id="invite-btn">Invite Member</button>
    </div>

    <section class="team-section">
      <h2>Members ({teamMembers.length})</h2>
      <table class="team-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Role</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {teamMembers.map(member => (
            <tr data-member-id={member.id}>
              <td class="member-info">
                <span class="member-avatar">{(member.user.name || member.user.email).charAt(0).toUpperCase()}</span>
                <div>
                  <span class="member-name">{member.user.name || 'No name'}</span>
                  <span class="member-email">{member.user.email}</span>
                </div>
              </td>
              <td>
                {member.userId === user.id ? (
                  <span class="role-badge owner">Owner (You)</span>
                ) : (
                  <select
                    class="role-select"
                    data-member-id={member.id}
                    data-original-role={member.role}
                  >
                    <option value="admin" selected={member.role === 'admin'}>Admin</option>
                    <option value="member" selected={member.role === 'member'}>Member</option>
                  </select>
                )}
              </td>
              <td>{new Date(member.createdAt).toLocaleDateString()}</td>
              <td>
                {member.userId !== user.id && (
                  <button class="btn btn-danger btn-sm remove-member-btn" data-member-id={member.id}>
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>

    {invitations.length > 0 && (
      <section class="team-section">
        <h2>Pending Invitations ({invitations.length})</h2>
        <table class="team-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Sent</th>
              <th>Expires</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invitations.map(invite => (
              <tr data-invitation-id={invite.id}>
                <td>{invite.email}</td>
                <td><span class="role-badge">{invite.role}</span></td>
                <td>{new Date(invite.createdAt).toLocaleDateString()}</td>
                <td>{new Date(invite.expiresAt).toLocaleDateString()}</td>
                <td class="invitation-actions">
                  <button class="btn btn-secondary btn-sm resend-invite-btn" data-invitation-id={invite.id}>
                    Resend
                  </button>
                  <button class="btn btn-danger btn-sm cancel-invite-btn" data-invitation-id={invite.id}>
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    )}

    <!-- Invite Modal -->
    <dialog id="invite-modal" class="modal">
      <form id="invite-form" class="modal-content">
        <h2>Invite Team Member</h2>

        <div class="form-group">
          <label for="invite-email">Email Address</label>
          <input type="email" id="invite-email" name="email" required />
        </div>

        <div class="form-group">
          <label for="invite-role">Role</label>
          <select id="invite-role" name="role">
            <option value="admin">Admin - Can manage incidents and components</option>
            <option value="member">Member - Can create and update incidents</option>
          </select>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="cancel-invite">Cancel</button>
          <button type="submit" class="btn btn-primary">Send Invitation</button>
        </div>
      </form>
    </dialog>
  </div>

  <script define:vars={{ pageId }}>
    import { initTeamManagement } from '@/scripts/team';
    initTeamManagement(pageId);
  </script>
</DashboardLayout>
```

### Team Management Script
```typescript
// src/scripts/team.ts
export function initTeamManagement(pageId: string) {
  const inviteBtn = document.getElementById('invite-btn');
  const inviteModal = document.getElementById('invite-modal') as HTMLDialogElement;
  const inviteForm = document.getElementById('invite-form') as HTMLFormElement;
  const cancelInviteBtn = document.getElementById('cancel-invite');

  // Open invite modal
  inviteBtn?.addEventListener('click', () => inviteModal.showModal());
  cancelInviteBtn?.addEventListener('click', () => inviteModal.close());

  // Send invitation
  inviteForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(inviteForm);

    const response = await fetch(`/api/pages/${pageId}/team/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.get('email'),
        role: formData.get('role'),
      }),
    });

    if (response.ok) {
      inviteModal.close();
      window.location.reload();
    } else {
      const { error } = await response.json();
      alert(error.message);
    }
  });

  // Role change
  document.querySelectorAll('.role-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const target = e.target as HTMLSelectElement;
      const memberId = target.dataset.memberId;
      const newRole = target.value;

      const response = await fetch(`/api/pages/${pageId}/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        target.value = target.dataset.originalRole!;
        const { error } = await response.json();
        alert(error.message);
      }
    });
  });

  // Remove member
  document.querySelectorAll('.remove-member-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.target as HTMLButtonElement;
      const memberId = target.dataset.memberId;

      if (!confirm('Are you sure you want to remove this team member?')) return;

      const response = await fetch(`/api/pages/${pageId}/team/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        target.closest('tr')?.remove();
      } else {
        const { error } = await response.json();
        alert(error.message);
      }
    });
  });

  // Resend invitation
  document.querySelectorAll('.resend-invite-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.target as HTMLButtonElement;
      const invitationId = target.dataset.invitationId;

      const response = await fetch(`/api/pages/${pageId}/team/invitations/${invitationId}/resend`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Invitation resent!');
      } else {
        const { error } = await response.json();
        alert(error.message);
      }
    });
  });

  // Cancel invitation
  document.querySelectorAll('.cancel-invite-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.target as HTMLButtonElement;
      const invitationId = target.dataset.invitationId;

      if (!confirm('Cancel this invitation?')) return;

      const response = await fetch(`/api/pages/${pageId}/team/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        target.closest('tr')?.remove();
      }
    });
  });
}
```

### Invite API Endpoint
```typescript
// src/pages/api/pages/[pageId]/team/invite.ts
import type { APIRoute } from 'astro';
import { requireOwner } from '@/lib/auth/guards';
import { createDb, TeamInvitationRepository, TeamMemberRepository, UserRepository } from '@/db';

export const POST: APIRoute = async (context) => {
  const { pageId } = context.params;
  const authResponse = await requireOwner(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const { email, role } = await context.request.json();
  const normalizedEmail = email.toLowerCase().trim();

  // Check if already a team member
  const existingUser = await UserRepository.findByEmail(db, normalizedEmail);
  if (existingUser) {
    const existingMember = await TeamMemberRepository.findByPageAndUser(db, pageId, existingUser.id);
    if (existingMember) {
      return new Response(JSON.stringify({
        error: { code: 'ALREADY_MEMBER', message: 'This user is already a team member' }
      }), { status: 400 });
    }
  }

  // Check if already invited
  const existingInvite = await TeamInvitationRepository.findPendingByEmail(db, pageId, normalizedEmail);
  if (existingInvite) {
    return new Response(JSON.stringify({
      error: { code: 'ALREADY_INVITED', message: 'An invitation has already been sent to this email' }
    }), { status: 400 });
  }

  // Create invitation
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitation = await TeamInvitationRepository.create(db, {
    pageId,
    email: normalizedEmail,
    role,
    token,
    expiresAt: expiresAt.toISOString(),
    invitedBy: context.locals.user!.id,
  });

  // Queue invitation email
  const inviteUrl = `${context.locals.runtime.env.APP_URL}/invite/${token}`;
  await context.locals.runtime.env.EMAIL_QUEUE.send({
    type: 'team_invitation',
    to: normalizedEmail,
    data: {
      inviteUrl,
      inviterName: context.locals.user!.name || context.locals.user!.email,
      pageName: (await PageRepository.findById(db, pageId))?.name,
      role,
    },
  });

  return new Response(JSON.stringify({ invitation }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### Accept Invitation Page
```astro
// src/pages/invite/[token].astro
---
import BaseLayout from '@/components/BaseLayout.astro';
import { createDb, TeamInvitationRepository, TeamMemberRepository, UserRepository, PageRepository } from '@/db';

const { token } = Astro.params;
const db = createDb(Astro.locals.runtime.env.DB);

const invitation = await TeamInvitationRepository.findByToken(db, token);

if (!invitation) {
  return Astro.redirect('/auth/login?error=invalid_invitation');
}

if (invitation.acceptedAt) {
  return Astro.redirect('/auth/login?error=invitation_already_used');
}

if (new Date(invitation.expiresAt) < new Date()) {
  return Astro.redirect('/auth/login?error=invitation_expired');
}

const page = await PageRepository.findById(db, invitation.pageId);
const { user } = Astro.locals;
---

<BaseLayout title="Accept Invitation">
  <div class="invite-container">
    <h1>You've been invited!</h1>
    <p>You've been invited to join <strong>{page?.name}</strong> as a {invitation.role}.</p>

    {user ? (
      <form action={`/api/invite/${token}/accept`} method="POST">
        <p>You're signed in as <strong>{user.email}</strong>.</p>
        <button type="submit" class="btn btn-primary">Accept Invitation</button>
      </form>
    ) : (
      <div>
        <p>Sign in or create an account to accept this invitation.</p>
        <a href={`/auth/login?redirect=/invite/${token}&email=${invitation.email}`} class="btn btn-primary">
          Continue
        </a>
      </div>
    )}
  </div>
</BaseLayout>
```

---

## Testing

- [ ] Only owners can access team management page
- [ ] Team members list displays correctly
- [ ] Invitation sent successfully
- [ ] Duplicate invitation prevented
- [ ] Invitation email received
- [ ] Accept invitation creates team membership
- [ ] Accept invitation creates user if needed
- [ ] Role change updates correctly
- [ ] Cannot change own role
- [ ] Remove member works
- [ ] Cannot remove self
- [ ] Expired invitations rejected
- [ ] Resend invitation works
- [ ] Cancel invitation works

---

## Files to Create/Modify

- `src/pages/app/[pageId]/team/index.astro`
- `src/scripts/team.ts`
- `src/pages/api/pages/[pageId]/team/invite.ts`
- `src/pages/api/pages/[pageId]/team/[memberId].ts`
- `src/pages/api/pages/[pageId]/team/invitations/[invitationId]/resend.ts`
- `src/pages/api/pages/[pageId]/team/invitations/[invitationId]/index.ts`
- `src/pages/invite/[token].astro`
- `src/pages/api/invite/[token]/accept.ts`
- `src/lib/email/templates/team-invitation.tsx`
- `src/db/repositories/team-invitations.ts`
