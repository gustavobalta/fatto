import { createClient } from '@supabase/supabase-js'

const URL = 'https://tlvunnzgrawkolgrgucd.supabase.co'
const KEY = 'sb_publishable_femG4JIuhFuwwqrACu31pQ_Az53bt3G'

export const supabase = createClient(URL, KEY)
