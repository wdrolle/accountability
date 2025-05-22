# Install Ollama and Llama3.2
```bash
sudo apt update
sudo apt upgrade
```

# Install Ollama
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

# Install Llama3.2
```bash
ollama pull llama3.2
ollama run llama3.2
```

# Run and configure Ollama
```bash
ollama serve
```

# Check the current status of the Ollama service
```bash
systemctl status ollama
```

# Installing the WebUI
Ollama's WebUI makes managing your setup a breeze. Here's how to get it up and running. (I ran the following commands in Windows WSL)

## Install Docker
Docker is essential for the WebUI. Follow these steps to install it:

### Add Docker's Official GPG Key:
```bash
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

### Add the Repository to Apt Sources:
```bash
echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
$(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```

### Install Docker:
```bash
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

# Run Docker
Now, let's run Docker to set up the WebUI:
```bash
sudo docker run -d --network=host -v open-webui:/app/backend/data -e OLLAMA_BASE_URL=http://127.0.0.1:11434 --name open-webui --restart always ghcr.io/open-webui/open-webui:main
```

# Access the WebUI
Open your browser and go to:
```bash
http://localhost:8080
```

Sign up on the web portal, and you're good to go!

## Application Routes

| Route | Description |
|-------|-------------|
| /roadmap | Roadmap page |
| /features | Features overview |
| /blog | Blog posts |
| /error | Error page |
| /integrations | Technology stack and integrations |
| /scripture/advanced-search | Advanced scripture search |
| /community/groups/browse | Browse all groups |
| /docs | Documentation |
| /studio | Sanity Studio (CMS) |
| /ai-examples/interview-question-generator | AI Interview Question Generator |
| /community/groups/study-groups | Study groups listing |
| /ai-examples/product-name-generator | AI Product Name Generator |
| /community/groups | Groups overview |
| /community | Community homepage |
| /community/add-family | Add family members |
| /admin-console | Admin dashboard |
| /community/discussions | Community discussions |
| /admin-console/users | User management |
| /ai-examples/article-title-generator | AI Article Title Generator |

### Admin Routes
| Route | Description |
|-------|-------------|
| /admin-console/roles | Role management |
| /admin-console/messages/queue | Message queue |
| /admin-console/messages/schedule | Message scheduling |
| /admin-console/jobs | System jobs |

## GroupDetailsPage Components

### NotesTab
- Create, view, and delete notes
- Visibility levels: private, leader-only, and group-wide
- Displays note author, creation date, and visibility status
- Requires group membership

### PrayersTab
- Submit and view prayer requests
- Prayer count tracking functionality
- Visibility levels: private, leader-only, and group-wide
- Displays author, date, and visibility status
- Requires group membership

### ChatTab
- Real-time group chat functionality
- Message history with timestamps
- User avatars and names displayed
- Auto-scroll to latest messages
- Enter to send support
- Requires group membership

### WhiteboardTab
- Collaborative drawing and planning space
- Real-time updates for all members
- Save and load previous drawings
- Requires group membership

### InfoTab
- Group description and details
- Meeting schedules and information
- Group rules and guidelines
- Resource links and materials

### MembersList
- Display of all group members
- Member roles and permissions
- Online status indicators
- Member activity tracking

### GroupHeader
- Group name and image
- Quick access to group actions
- Membership status
- Group visibility status

## File Structure and Dependencies

### Group Details Components
| Component | Path | Related Files |
|-----------|------|---------------|
| GroupDetailClient | `src/app/(site)/community/groups/[id]/GroupDetailClient.tsx` | Main container component |
| MembersList | `src/app/(site)/community/groups/[id]/GroupDetailClient/MembersList.tsx` | Component for displaying group members |
| ManageMembersModal | `src/app/(site)/community/groups/[id]/components/ManageMembersModal.tsx` | Modal for managing group members |
| ManageAdminsModal | `src/app/(site)/community/groups/[id]/components/ManageAdminsModal.tsx` | Modal for managing group admins |
| GroupHeader | `src/app/(site)/community/groups/[id]/GroupDetailClient/GroupHeader.tsx` | Group header component |
| Types | `src/app/(site)/community/groups/[id]/GroupDetailClient/types.ts` | Type definitions |

### API Routes
| Route | Path | Description |
|-------|------|-------------|
| Members API | `src/app/api/bible-study-groups/[id]/members/route.ts` | Handles member-related operations |
| Contact API | `src/app/api/contact/route.ts` | Handles contact-related operations |

### Utility Files
| File | Path | Description |
|------|------|-------------|
| Group Utils | `src/lib/group-utils.ts` | Group-related utility functions |
| Constants | `src/lib/constants.ts` | Application constants |