import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateSiteDto {
  @IsString() @IsOptional() heroTitle?: string;
  @IsString() @IsOptional() heroSubtitle?: string;
  @IsString() @IsOptional() heroCtaText?: string;
  @IsString() @IsOptional() heroImage?: string;
  @IsString() @IsOptional() testimonialPhoto?: string;
  @IsString() @IsOptional() aboutImage?: string;
  @IsString() @IsOptional() missionImage?: string;
  @IsString() @IsOptional() visionImage?: string;
  // Listas [{ title, desc }] guardadas como JSON.
  @IsArray() @IsOptional() classes?: any[];
  @IsArray() @IsOptional() features?: any[];
  @IsArray() @IsOptional() coaches?: any[];
  @IsString() @IsOptional() testimonial?: string;
  @IsString() @IsOptional() testimonialAuthor?: string;
  @IsString() @IsOptional() mission?: string;
  @IsString() @IsOptional() vision?: string;
  @IsString() @IsOptional() scheduleText?: string;
  @IsString() @IsOptional() email?: string;
  @IsString() @IsOptional() instagram?: string;
  @IsString() @IsOptional() facebook?: string;
  @IsString() @IsOptional() tiktok?: string;
}
