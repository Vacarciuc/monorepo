import { Exclude } from 'class-transformer'

import { UserDto } from '@/dto/user.dto'

@Exclude()
export class GetSelfDto extends UserDto {}
