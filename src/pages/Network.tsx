import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MessageSquare,
  Linkedin,
  Edit,
  Trash2,
  UserPlus
} from "lucide-react";
import { Contact, ContactGroup } from "@/types";

export default function Network() {
  const { 
    contacts, 
    contactGroups, 
    projects,
    addContact, 
    updateContact, 
    deleteContact,
    addContactGroup,
    updateContactGroup,
    deleteContactGroup
  } = useApp();

  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [contactForm, setContactForm] = useState({
    name: "",
    avatarUrl: "",
    email: "",
    phone: "",
    linkedin: "",
    whatsapp: "",
    skills: "",
    notes: "",
    projectIds: [] as string[],
    attachments: [] as { name: string; url: string }[],
  });

  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    memberIds: [] as string[]
  });

  const handleCreateContact = () => {
    setEditingContact(null);
    setContactForm({
      name: "",
      avatarUrl: "",
      email: "",
      phone: "",
      linkedin: "",
      whatsapp: "",
      skills: "",
      notes: "",
      projectIds: []
    });
    setIsContactDialogOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      avatarUrl: contact.avatarUrl || "",
      email: contact.email || "",
      phone: contact.phone || "",
      linkedin: contact.linkedin || "",
      whatsapp: contact.whatsapp || "",
      skills: contact.skills.join(", "),
      notes: contact.notes || "",
      projectIds: contact.projectIds,
      attachments: contact.attachments || []
    });
    setIsContactDialogOpen(true);
  };

  const handleSaveContact = () => {
    if (!contactForm.name.trim()) return;

    const skillsArray = contactForm.skills
      .split(",")
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);

    const contactData = {
      name: contactForm.name,
      avatarUrl: contactForm.avatarUrl || undefined,
      email: contactForm.email || undefined,
      phone: contactForm.phone || undefined,
      linkedin: contactForm.linkedin || undefined,
      whatsapp: contactForm.whatsapp || undefined,
      skills: skillsArray,
      notes: contactForm.notes || undefined,
      projectIds: contactForm.projectIds,
      groupIds: editingContact?.groupIds || [],
      attachments: contactForm.attachments,
    };

    if (editingContact) {
      updateContact(editingContact.id, contactData);
    } else {
      addContact(contactData);
    }

    setIsContactDialogOpen(false);
    setEditingContact(null);
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setGroupForm({
      name: "",
      description: "",
      memberIds: []
    });
    setIsGroupDialogOpen(true);
  };

  const handleEditGroup = (group: ContactGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || "",
      memberIds: group.memberIds
    });
    setIsGroupDialogOpen(true);
  };

  const handleSaveGroup = () => {
    if (!groupForm.name.trim()) return;

    const groupData = {
      name: groupForm.name,
      description: groupForm.description || undefined,
      memberIds: groupForm.memberIds
    };

    if (editingGroup) {
      updateContactGroup(editingGroup.id, groupData);
    } else {
      addContactGroup(groupData);
    }

    setIsGroupDialogOpen(false);
    setEditingGroup(null);
  };

  const handleDeleteContact = (contactId: string) => {
    if (confirm('Tem certeza que deseja excluir este contato?')) {
      deleteContact(contactId);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('Tem certeza que deseja excluir este grupo?')) {
      deleteContactGroup(groupId);
    }
  };

  const getContactById = (contactId: string) => {
    return contacts.find(c => c.id === contactId);
  };

  const getProjectById = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Network</h1>
          <p className="text-muted-foreground">
            Gerencie seus contatos e grupos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateGroup}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Grupo
          </Button>
          <Button variant="gradient" onClick={handleCreateContact} className="animate-glow">
            <Plus className="w-4 h-4 mr-2" />
            Novo Contato
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar contatos por nome ou habilidades..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="contacts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contacts">Contatos ({contacts.length})</TabsTrigger>
          <TabsTrigger value="groups">Grupos ({contactGroups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.length === 0 ? (
              <div className="col-span-full">
                <Card className="shadow-elegant">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {searchTerm ? "Nenhum contato encontrado" : "Nenhum contato criado"}
                    </h3>
                    <p className="text-muted-foreground text-center mb-6">
                      {searchTerm 
                        ? "Tente buscar por outros termos" 
                        : "Comece adicionando seus primeiros contatos"
                      }
                    </p>
                    {!searchTerm && (
                      <Button onClick={handleCreateContact}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Contato
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <Card key={contact.id} className="shadow-elegant hover:shadow-glow transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={contact.avatarUrl} alt={contact.name} />
                          <AvatarFallback>{contact.name?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{contact.name}</CardTitle>
                          {contact.notes && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {contact.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditContact(contact)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Contact Info */}
                      <div className="space-y-2">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.linkedin && (
                          <div className="flex items-center gap-2 text-sm">
                            <Linkedin className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{contact.linkedin}</span>
                          </div>
                        )}
                        {contact.whatsapp && (
                          <div className="flex items-center gap-2 text-sm">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            <span>{contact.whatsapp}</span>
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      {contact.skills.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            Habilidades
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {contact.skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {contact.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{contact.skills.length - 3} mais
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Projects */}
                      {contact.projectIds.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            Projetos
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {contact.projectIds.slice(0, 2).map((projectId) => {
                              const project = getProjectById(projectId);
                              return project ? (
                                <Badge 
                                  key={projectId} 
                                  variant="outline" 
                                  style={{ backgroundColor: project.color + '20', borderColor: project.color }}
                                  className="text-xs"
                                >
                                  {project.name}
                                </Badge>
                              ) : null;
                            })}
                            {contact.projectIds.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{contact.projectIds.length - 2} mais
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="groups">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactGroups.length === 0 ? (
              <div className="col-span-full">
                <Card className="shadow-elegant">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Nenhum grupo criado
                    </h3>
                    <p className="text-muted-foreground text-center mb-6">
                      Organize seus contatos em grupos para melhor gestão
                    </p>
                    <Button onClick={handleCreateGroup}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Grupo
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              contactGroups.map((group) => (
                <Card key={group.id} className="shadow-elegant hover:shadow-glow transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="w-5 h-5 text-primary" />
                          {group.name}
                        </CardTitle>
                        {group.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {group.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditGroup(group)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        {group.memberIds.length} membro{group.memberIds.length !== 1 ? 's' : ''}
                      </div>
                      
                      {group.memberIds.length > 0 && (
                        <div className="space-y-2">
                          {group.memberIds.slice(0, 3).map((memberId) => {
                            const contact = getContactById(memberId);
                            return contact ? (
                              <div key={memberId} className="flex items-center gap-2 text-sm">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={contact.avatarUrl} alt={contact.name} />
                                  <AvatarFallback className="text-xs">
                                    {contact.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{contact.name}</span>
                              </div>
                            ) : null;
                          })}
                          {group.memberIds.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{group.memberIds.length - 3} outros membros
                            </div>
                          )}
                        </div>
                      )}

                      <Dialog>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => handleEditGroup(group)}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Gerenciar Membros
                        </Button>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Contact Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'Editar Contato' : 'Novo Contato'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            <div>
              <Label htmlFor="contactAvatar">Foto do Perfil</Label>
              <div className="flex items-center gap-4 mt-2">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={contactForm.avatarUrl} alt={contactForm.name} />
                  <AvatarFallback>
                    {contactForm.name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <Input
                    id="contactAvatar"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const result = typeof reader.result === 'string' ? reader.result : '';
                        setContactForm(prev => ({ ...prev, avatarUrl: result }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  {contactForm.avatarUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setContactForm(prev => ({ ...prev, avatarUrl: "" }))}
                    >
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="contactName">Nome Completo *</Label>
              <Input
                id="contactName"
                value={contactForm.name}
                onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome completo"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactEmail">E-mail</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Telefone</Label>
                <Input
                  id="contactPhone"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactLinkedin">LinkedIn</Label>
                <Input
                  id="contactLinkedin"
                  value={contactForm.linkedin}
                  onChange={(e) => setContactForm(prev => ({ ...prev, linkedin: e.target.value }))}
                  placeholder="linkedin.com/in/usuario"
                />
              </div>
              <div>
                <Label htmlFor="contactWhatsapp">WhatsApp</Label>
                <Input
                  id="contactWhatsapp"
                  value={contactForm.whatsapp}
                  onChange={(e) => setContactForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contactSkills">Habilidades</Label>
              <Input
                id="contactSkills"
                value={contactForm.skills}
                onChange={(e) => setContactForm(prev => ({ ...prev, skills: e.target.value }))}
                placeholder="Separar por vírgula: React, Node.js, Design"
              />
            </div>

            <div>
              <Label htmlFor="contactNotes">Notas</Label>
              <Textarea
                id="contactNotes"
                value={contactForm.notes}
                onChange={(e) => setContactForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Anotações sobre o contato..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="contactAttachments">Anexos (imagens, vídeos, documentos)</Label>
              <Input
                id="contactAttachments"
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  const readers = files.map(file => new Promise<{name:string; url:string}>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve({ name: file.name, url: typeof reader.result === 'string' ? reader.result : '' });
                    reader.readAsDataURL(file);
                  }));
                  Promise.all(readers).then(list => {
                    setContactForm(prev => ({ ...prev, attachments: [...prev.attachments, ...list] }));
                  });
                }}
              />
              {contactForm.attachments.length > 0 && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {contactForm.attachments.map((att, idx) => (
                    <div key={`${att.name}-${idx}`} className="flex items-center justify-between p-2 rounded border text-xs">
                      <span className="truncate mr-2" title={att.name}>{att.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => setContactForm(prev => ({ ...prev, attachments: prev.attachments.filter((_,i)=>i!==idx) }))}>Remover</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveContact} className="flex-1">
                {editingContact ? 'Salvar Alterações' : 'Criar Contato'}
              </Button>
              <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Editar Grupo' : 'Novo Grupo'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Nome do Grupo *</Label>
              <Input
                id="groupName"
                value={groupForm.name}
                onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome do grupo"
              />
            </div>
            
            <div>
              <Label htmlFor="groupDescription">Descrição</Label>
              <Textarea
                id="groupDescription"
                value={groupForm.description}
                onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional do grupo"
                rows={3}
              />
            </div>

            <div>
              <Label>Membros do Grupo</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
                {contacts.map((c) => {
                  const isSelected = groupForm.memberIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`flex items-center justify-between p-2 rounded border text-sm ${isSelected ? 'bg-accent' : 'bg-card hover:bg-accent/50'}`}
                      onClick={() => {
                        setGroupForm(prev => ({
                          ...prev,
                          memberIds: isSelected
                            ? prev.memberIds.filter(id => id !== c.id)
                            : [...prev.memberIds, c.id]
                        }));
                      }}
                    >
                      <span>{c.name}</span>
                      {isSelected && <span className="text-xs">Selecionado</span>}
                    </button>
                  );
                })}
                {contacts.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-full">Nenhum contato para adicionar</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveGroup} className="flex-1">
                {editingGroup ? 'Salvar Alterações' : 'Criar Grupo'}
              </Button>
              <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}