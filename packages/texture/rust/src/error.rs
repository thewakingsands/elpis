#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(u8)]
pub enum Error {
    InvalidArgument = 1,
    InvalidTexture,
    UnsupportedFormat,
    UnsupportedLayout,
    ResourceLimit,
    DecodeFailed,
    EncodeFailed,
}

impl Error {
    pub fn message(self) -> &'static str {
        match self {
            Self::InvalidArgument => "Invalid conversion operation",
            Self::InvalidTexture => "Invalid or truncated TEX surface",
            Self::UnsupportedFormat => "Unsupported TEX pixel format",
            Self::UnsupportedLayout => "Expected a linear PC 2D TEX surface",
            Self::ResourceLimit => "Texture exceeds the resource budget",
            Self::DecodeFailed => "TEX block decoding failed",
            Self::EncodeFailed => "PNG encoding failed",
        }
    }
}

pub type Result<T> = std::result::Result<T, Error>;

pub fn allocate<T: Default + Clone>(length: usize) -> Result<Vec<T>> {
    let mut data = Vec::new();
    data.try_reserve_exact(length)
        .map_err(|_| Error::ResourceLimit)?;
    data.resize(length, T::default());
    Ok(data)
}
