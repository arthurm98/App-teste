
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signInAnonymously } from 'firebase/auth';
import { Book, User as UserIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

const resetPasswordSchema = z.object({
    resetEmail: z.string().email({ message: 'Por favor, insira um email válido para redefinir a senha.' }),
});


type LoginFormValues = z.infer<typeof loginSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;


export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors },
    reset,
  } = useForm<ResetPasswordFormValues>({
      resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleAuthError = (error: any) => {
    let title = 'Erro na Autenticação';
    let description = 'Ocorreu um erro. Por favor, tente novamente.';

    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        title = 'Credenciais Inválidas';
        description = 'O e-mail ou a senha estão incorretos. Verifique e tente novamente.';
        break;
      case 'auth/email-already-in-use':
        title = 'E-mail já cadastrado';
        description = 'Este e-mail já está em uso. Tente fazer login ou use um e-mail diferente.';
        break;
      case 'auth/invalid-email':
        title = 'E-mail Inválido';
        description = 'O formato do e-mail fornecido não é válido.';
        break;
      case 'auth/weak-password':
        title = 'Senha Fraca';
        description = 'Sua senha é muito fraca. Tente uma combinação mais forte.';
        break;
      default:
        console.error('Authentication Error:', error);
    }

    toast({
      variant: 'destructive',
      title,
      description,
    });
  };

  const handleLogin = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'Login bem-sucedido!',
        description: 'Redirecionando para sua biblioteca...',
      });
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Você está logado. Redirecionando para sua biblioteca...',
      });
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePasswordReset = async (data: ResetPasswordFormValues) => {
      setIsResetting(true);
      try {
          await sendPasswordResetEmail(auth, data.resetEmail);
          toast({
              title: "E-mail de redefinição enviado",
              description: `Se uma conta para ${data.resetEmail} existir, um e-mail foi enviado. Verifique sua caixa de entrada.`,
          });
          reset(); 
          document.getElementById('close-reset-dialog')?.click();
      } catch (error) {
          handleAuthError(error); 
      } finally {
          setIsResetting(false);
      }
  };

  const handleAnonymousLogin = async () => {
      setIsSubmitting(true);
      try {
          await signInAnonymously(auth);
          toast({
              title: "Modo offline ativado",
              description: "Sua biblioteca será salva neste dispositivo. Crie uma conta para sincronizar na nuvem.",
          });
          // O useEffect cuidará do redirecionamento
      } catch (error) {
          handleAuthError(error);
      } finally {
          setIsSubmitting(false);
      }
  }


  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Book className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Bem-vindo ao MangaTrack</CardTitle>
          <CardDescription>Faça login ou crie sua conta para sincronizar sua biblioteca na nuvem.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                disabled={isSubmitting}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                {...register('password')}
                disabled={isSubmitting}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            
            <div className="flex flex-col gap-2 pt-2">
               <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSubmit(handleRegister)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Criando...' : 'Criar Conta'}
              </Button>
            </div>
          </form>
          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-xs text-muted-foreground">OU</span>
          </div>
            <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleAnonymousLogin}
                disabled={isSubmitting}
              >
                <UserIcon className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Aguarde...' : 'Continuar Offline'}
              </Button>
        </CardContent>
        <CardFooter className="flex-col gap-4">
           <Dialog>
                <DialogTrigger asChild>
                    <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">Esqueceu sua senha?</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Redefinir Senha</DialogTitle>
                        <DialogDescription>
                            Digite seu e-mail para receber um link de redefinição de senha. Verifique sua caixa de spam se não o encontrar.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitReset(handlePasswordReset)}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="resetEmail" className="text-right">
                                    Email
                                </Label>
                                <Input
                                    id="resetEmail"
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="col-span-3"
                                    {...registerReset('resetEmail')}
                                    disabled={isResetting}
                                />
                            </div>
                             {resetErrors.resetEmail && <p className="col-start-2 col-span-3 text-xs text-destructive">{resetErrors.resetEmail.message}</p>}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild id="close-reset-dialog">
                                <Button type="button" variant="secondary">Cancelar</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isResetting}>
                                {isResetting ? 'Enviando...' : 'Enviar Link'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <p className="text-xs text-muted-foreground text-center w-full">Criado por ArthurM</p>
        </CardFooter>
      </Card>
    </div>
  );
}
 

    