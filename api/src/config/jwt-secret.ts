// Fuente unica del secreto JWT. En PRODUCCION exige un secreto fuerte: si no
// esta configurado (o quedo el placeholder/dev), la app NO arranca — mejor
// fallar ruidosamente que firmar tokens con un secreto conocido y publico.
// En desarrollo permite un fallback para no frenar el trabajo local.

const KNOWN_INSECURE = new Set([
  'dev_secret',
  'dev_only_insecure_secret',
  'cambia_esto_por_un_secreto_muy_largo_y_aleatorio',
]);

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (!secret || KNOWN_INSECURE.has(secret)) {
    if (isProd) {
      throw new Error(
        'JWT_SECRET no esta configurado con un valor seguro. Defini uno en el ' +
          '.env de produccion, por ejemplo:  openssl rand -base64 48',
      );
    }
    // Solo desarrollo local: nunca llega aca en produccion.
    return 'dev_only_insecure_secret';
  }

  if (isProd && secret.length < 32) {
    throw new Error(
      'JWT_SECRET es demasiado corto para produccion (minimo 32 caracteres). ' +
        'Genera uno con:  openssl rand -base64 48',
    );
  }

  return secret;
}
