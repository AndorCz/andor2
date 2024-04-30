import md5 from 'crypto-js/md5'
import { supabase } from '@lib/database'

export async function getOldUserId (oldLogin, oldPassword) {
  const hashedPassword = md5(oldPassword).toString()

  const { data: userInfoMigrate, error: userError } = await supabase
    .from('old_users')
    .select('old_id')
    .eq('old_login', oldLogin)
    .eq('old_psw', hashedPassword)
    .maybeSingle()

  if (userError || !userInfoMigrate) {
    return ''
  } else {
    return userInfoMigrate.old_id
  }
}
