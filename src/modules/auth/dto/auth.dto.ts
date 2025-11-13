import { IsNotEmpty, IsString, MinLength, Validate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isUsernameOrEmail', async: false })
export class IsUsernameOrEmail implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;

    return emailRegex.test(value) || usernameRegex.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Login identifier must be a valid username or email address';
  }
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @Validate(IsUsernameOrEmail)
  @ApiProperty({ description: 'Username or email' })
  identifier!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @ApiProperty({ description: 'User password' })
  password!: string;
}
