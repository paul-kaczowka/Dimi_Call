import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface TicketFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userEmail?: string | null;
  appVersion?: string;
}

const ticketFormSchema = z.object({
  subject: z.string().min(1, { message: "Le sujet est requis." }),
  message: z.string().min(1, { message: "Le message est requis." }),
});

export function TicketForm({ isOpen, onOpenChange, userEmail, appVersion }: TicketFormProps) {
  const form = useForm<z.infer<typeof ticketFormSchema>>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof ticketFormSchema>) {
    const to = "dmcprosp@gmail.com";
    const subject = encodeURIComponent(values.subject);
    
    const bodyContent = [
      values.message,
      "",
      "---",
      "Informations de débogage :",
      `- Email de l'utilisateur : ${userEmail || 'Non connecté'}`,
      `- Version de l'application : ${appVersion || 'Inconnue'}`,
      "PS: Si possible, veuillez joindre une capture d'écran du problème.",
    ].join("\n");

    const body = encodeURIComponent(bodyContent);

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
    
    window.open(gmailUrl, '_blank');
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Envoyer un ticket</DialogTitle>
          <DialogDescription>
            Remplissez le formulaire ci-dessous pour envoyer un ticket par e-mail.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sujet</FormLabel>
                  <FormControl>
                    <Input placeholder="Sujet de votre ticket" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez votre problème ou suggestion ici."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="submit">Envoyer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 